import mongoose from "mongoose";

let transactionsReady = false;

// What: Asynchronous database lifecycle function.
// Does: Opens Mongoose and verifies the deployment supports the transactions required by ordering and ownership flows.
// If removed: The API can start against an incompatible standalone MongoDB and expose transaction-backed endpoints that fail at runtime.
export async function connectDatabase(uri: string) {
  await mongoose.connect(uri, { autoIndex: process.env.NODE_ENV !== "production" });
  try {
    const database = mongoose.connection.db;
    if (!database) throw new Error("MongoDB connected without an available database handle.");
    const hello = await database.admin().command({ hello: 1 });
    const transactionCapable = typeof hello.setName === "string" || hello.msg === "isdbgrid";
    if (!transactionCapable) {
      throw new Error(
        "MongoDB must run as a replica set or mongos because task moves, column moves, and ownership transfers are transactional.",
      );
    }
    transactionsReady = true;
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }
}

// What: Asynchronous database lifecycle function.
// Does: Closes the active Mongoose connection during tests and graceful shutdown.
// If removed: Processes can leak sockets, hang on exit, or terminate writes abruptly.
export async function disconnectDatabase() {
  transactionsReady = false;
  await mongoose.disconnect();
}

// What: Database state query function.
// Does: Converts the Mongoose connection state into the readiness signal used by the API.
// If removed: The readiness endpoint cannot distinguish a usable API from a disconnected one.
export function isDatabaseReady() {
  return mongoose.connection.readyState === 1 && transactionsReady;
}
