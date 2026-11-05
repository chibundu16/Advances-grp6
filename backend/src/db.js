import "dotenv/config";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

// A "pool" keeps a few database connections open and shares them between requests.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Small helper so the rest of the code can write: await query("SELECT ...", [values])
export function query(text, params) {
  return pool.query(text, params);
}
