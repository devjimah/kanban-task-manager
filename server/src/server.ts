import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

await connectDatabase(env.MONGODB_URI);
const server = createServer(createApp(env));

// What: HTTP server listening callback function.
// Does: Reports the bound port after the operating system accepts the listener.
// If removed: The server still starts, but operators lose its startup confirmation.
server.listen(env.PORT, () => {
  console.log(`Kanban API listening on port ${env.PORT}`);
});

// What: Asynchronous graceful-shutdown function.
// Does: Stops new HTTP traffic, closes MongoDB, and exits with an accurate status.
// If removed: Termination can interrupt requests and leave database sockets open.
async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down`);
  // What: Asynchronous HTTP-close callback function.
  // Does: Disconnects persistence after active HTTP connections finish closing.
  // If removed: Shutdown never completes its database cleanup or final exit decision.
  server.close(async (error) => {
    await disconnectDatabase();
    process.exit(error ? 1 : 0);
  });
}

// What: One-time SIGINT listener function.
// Does: Starts graceful shutdown when an interactive process is interrupted.
// If removed: Ctrl+C can bypass the server's cleanup sequence.
process.once("SIGINT", () => void shutdown("SIGINT"));
// What: One-time SIGTERM listener function.
// Does: Starts graceful shutdown when a process supervisor requests termination.
// If removed: Container and platform termination can bypass cleanup.
process.once("SIGTERM", () => void shutdown("SIGTERM"));
