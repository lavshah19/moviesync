import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDB, disconnectDB } from "./config/db";
import app from "./app";
import { closeSocket, initSocket } from "./socket/index.js";
import type { Server } from "node:http";

let server: Server | undefined;

connectDB()
  .then(() => {
    server = app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT}`);
    });
    initSocket(server); // same port: Socket.IO handles the /socket.io/ path on this server
  })
  .catch((err) => {
    logger.fatal({ err }, "Failed to connect to MongoDB");
    logger.flush(() => process.exit(1));
  });

function shutdown(signal: string, code = 0) {
  logger.info(`${signal} received, shutting down`);
  const exit = (err?: Error) => {
    if (err) logger.error({ err }, "Error while closing server");
    disconnectDB()
      .catch((e) => logger.error({ err: e }, "Error while closing MongoDB"))
      // flush buffered logs before exiting
      .finally(() => logger.flush(() => process.exit(err ? 1 : code)));
  };
  // closeSocket disconnects every socket and then closes the HTTP server itself
  if (server) void closeSocket().then(() => exit());
  else exit();
  // force exit if connections don't drain
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled rejection");
  shutdown("unhandledRejection", 1);
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  logger.flush(() => process.exit(1));
});
