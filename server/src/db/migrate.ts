import { closeDb, connectDb } from "../config/db.js";

async function main() {
  await connectDb();
  console.log("✔ MongoDB indexes are up to date.");
}

main()
  .catch((err) => {
    console.error("✖ Migration failed:", err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
