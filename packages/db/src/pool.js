import pg from "pg";

const { Pool } = pg;

/** @type {import('pg').Pool | null} */
let pool = null;

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || "";
}

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

export function getPool() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: Number(process.env.DB_POOL_MAX || 5),
    });
  }
  return pool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
