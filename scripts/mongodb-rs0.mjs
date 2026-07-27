import mongoose from "mongoose";

const command = process.argv[2];
const argumentsList = process.argv.slice(3);

function readOption(name, fallback) {
  const index = argumentsList.indexOf(`--${name}`);
  return index >= 0 ? argumentsList[index + 1] : fallback;
}

async function openConnection(uri) {
  return mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 5_000,
  }).asPromise();
}

async function initializeReplicaSet() {
  const uri = readOption("uri", "mongodb://127.0.0.1:27019/admin?directConnection=true");
  const host = readOption("host", "127.0.0.1:27019");
  const setName = readOption("set", "rs0");
  const connection = await openConnection(uri);

  try {
    const admin = connection.db.admin();
    let hello = await admin.command({ hello: 1 });

    if (!hello.setName) {
      await admin.command({
        replSetInitiate: {
          _id: setName,
          members: [{ _id: 0, host }],
        },
      });
    } else if (hello.setName !== setName) {
      throw new Error(`MongoDB already belongs to replica set '${hello.setName}', not '${setName}'.`);
    }

    for (let attempt = 0; attempt < 80; attempt += 1) {
      hello = await admin.command({ hello: 1 });
      if (hello.setName === setName && hello.isWritablePrimary) {
        console.log(`MongoDB replica set ${setName} is primary at ${host}.`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(`Replica set ${setName} did not elect a primary within 20 seconds.`);
  } finally {
    await connection.close();
  }
}

async function verifyReplicaSet() {
  const uri = readOption("uri", "mongodb://127.0.0.1:27019/admin?replicaSet=rs0");
  const setName = readOption("set", "rs0");
  const connection = await openConnection(uri);

  try {
    const hello = await connection.db.admin().command({ hello: 1 });
    if (hello.setName !== setName || !hello.isWritablePrimary) {
      throw new Error(`MongoDB is not a writable primary in replica set ${setName}.`);
    }
    console.log(`Verified writable MongoDB replica set ${setName}.`);
  } finally {
    await connection.close();
  }
}

async function copyIndexes(sourceCollection, targetCollection) {
  const indexes = await sourceCollection.indexes();
  for (const index of indexes) {
    if (index.name === "_id_") continue;
    const options = {
      name: index.name,
      ...(index.unique !== undefined ? { unique: index.unique } : {}),
      ...(index.sparse !== undefined ? { sparse: index.sparse } : {}),
      ...(index.expireAfterSeconds !== undefined ? { expireAfterSeconds: index.expireAfterSeconds } : {}),
      ...(index.partialFilterExpression ? { partialFilterExpression: index.partialFilterExpression } : {}),
      ...(index.collation ? { collation: index.collation } : {}),
    };
    await targetCollection.createIndex(index.key, options);
  }
}

async function migrateDatabase() {
  const sourceUri = readOption("source", "mongodb://127.0.0.1:27017/kanban?directConnection=true");
  const targetUri = readOption("target", "mongodb://127.0.0.1:27019/kanban?replicaSet=rs0");
  if (sourceUri === targetUri) throw new Error("Source and target MongoDB URIs must differ.");

  const [source, target] = await Promise.all([openConnection(sourceUri), openConnection(targetUri)]);
  try {
    const collections = (await source.db.listCollections().toArray())
      .map((collection) => collection.name)
      .filter((name) => !name.startsWith("system."));

    for (const name of collections) {
      const sourceCollection = source.db.collection(name);
      const targetCollection = target.db.collection(name);
      const existingTargetCount = await targetCollection.countDocuments();
      if (existingTargetCount > 0) {
        throw new Error(`Target collection '${name}' is not empty; migration stopped to avoid overwriting data.`);
      }

      const documents = await sourceCollection.find({}).toArray();
      if (documents.length > 0) await targetCollection.insertMany(documents, { ordered: true });
      await copyIndexes(sourceCollection, targetCollection);
      console.log(`Migrated ${documents.length} document(s) from ${name}.`);
    }
  } finally {
    await Promise.allSettled([source.close(), target.close()]);
  }
}

if (command === "init") {
  await initializeReplicaSet();
} else if (command === "verify") {
  await verifyReplicaSet();
} else if (command === "migrate") {
  await migrateDatabase();
} else {
  throw new Error("Usage: node scripts/mongodb-rs0.mjs <init|verify|migrate> [options]");
}
