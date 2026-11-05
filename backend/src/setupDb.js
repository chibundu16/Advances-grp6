// Run once with: npm run setup-db
// Creates the tables if they don't exist yet (safe to run again).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./db.js";

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "schema.sql"), "utf8");

try {
  await pool.query(sql);
  console.log("Database tables are ready.");
} catch (err) {
  console.error("Could not set up the database:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
