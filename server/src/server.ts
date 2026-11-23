import { createApp } from "./app.js";
import { closeDb, connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import dns from "node:dns";
dns.setServers(["8.8.8.8"]);

async function main() {
  try {
    await connectDb();
  } catch (err) {
    const e = err as { message?: string };
    throw new Error(`Cannot connect to MongoDB: ${e.message ?? err}`);
  }

  const server = createApp().listen(env.PORT, () => {
    console.log(`✔ KH Luxury API listening on http://localhost:${env.PORT}/api`);
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    console.error(
      err.code === "EADDRINUSE"
        ? `✖ Port ${env.PORT} is already in use by another program. Set a different PORT in server/.env (and VITE_API_URL in the project's .env.local to match).`
        : err,
    );
    process.exit(1);
  });

  const shutdown = () => {
    server.close(() => void closeDb().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("✖ Failed to start:", err.message ?? err);
  process.exit(1);
});
