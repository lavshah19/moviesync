import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDB, disconnectDB } from "./config/db";
import app from "./app";
import type { Server } from "node:http";

let server: Server | undefined;

connectDB()
  .then(() => {
    server = app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT}`);
    });
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
  if (server) server.close(exit);
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
