// Validate that a MongoDB URI is reachable and transaction-capable before deploying.
//
//   MONGODB_URI="mongodb+srv://user:pass@cluster/kanban" node scripts/check-mongodb-uri.mjs
//
// The API refuses to start against a standalone mongod because task moves,
// column moves, and ownership transfer use multi-document transactions. Run this
// against a production URI first so a bad connection string is caught before it
// reaches a deployed environment.
//
// If this fails with `querySrv ECONNREFUSED`, the network blocks the DNS SRV
// lookup that `mongodb+srv://` requires rather than rejecting the credentials.
// Use the non-SRV form instead, taking the shard hostnames and replica set name
// from the cluster's SRV/TXT records:
//   mongodb://user:pass@shard-00-00.host:27017,shard-00-01.host:27017/db\
//     ?ssl=true&replicaSet=<name>&authSource=admin
// Keep the hostnames (not IPs) so TLS SNI and certificate validation still pass.
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is not set.");
  process.exit(2);
}

// Atlas shows a template URI with angle-bracket placeholders; connecting with
// those still present produces a confusing auth error rather than an obvious one.
if (/<[^>]+>/.test(uri)) {
  const placeholders = [...uri.matchAll(/<([^>]+)>/g)].map((match) => match[1]).join(", ");
  console.error(`URI still contains unsubstituted placeholders: ${placeholders}`);
  console.error("Replace them with real credentials before deploying.");
  process.exit(2);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  const transactionCapable = typeof hello.setName === "string" || hello.msg === "isdbgrid";

  console.log(`connected       : yes`);
  console.log(`replica set     : ${hello.setName ?? "(standalone)"}`);
  console.log(`database        : ${mongoose.connection.name}`);
  console.log(`transactions    : ${transactionCapable ? "supported" : "NOT SUPPORTED"}`);

  if (!transactionCapable) {
    console.error("\nThis deployment cannot serve the API: /ready will return 503 NOT_READY.");
    process.exit(1);
  }

  // Commit a real multi-document transaction to prove the capability end to end.
  const session = await mongoose.startSession();
  try {
    const probe = mongoose.connection.collection("_deploy_probe");
    await session.withTransaction(async () => {
      await probe.insertOne({ checkedAt: new Date() }, { session });
      await probe.deleteMany({}, { session });
    });
  } finally {
    await session.endSession();
  }
  console.log(`commit test     : passed`);
  console.log("\nURI is ready for deployment.");
} catch (error) {
  console.error(`connection failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
} finally {
  await mongoose.disconnect().catch(() => undefined);
}
