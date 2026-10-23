import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, getPool, hasDatabase } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function migrate() {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is required for migrate");
  }
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
  await getPool().query(sql);
}

async function main() {
  await migrate();
  console.log("Database migrated");
  await closePool();
}

const isDirect =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirect) {
  main().catch(async (error) => {
    console.error(error);
    await closePool();
    process.exit(1);
  });
}
