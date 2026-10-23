import { query } from "./pool.js";

export const DEFAULT_SETTINGS = {
  autoDiscovery: true,
  batchSize: 8,
  intervalMs: 60000,
  delayMs: 2000,
  discoverEvery: 1,
  queriesPerTick: 2,
  maxPendingQueue: 5000,
  defaultLanguage: "uz",
  defaultCategoryId: "tech",
  duplicateHandling: "skip",
  moderationRequired: false,
};

const BOUNDS = {
  batchSize: [1, 50],
  intervalMs: [10000, 3600000],
  delayMs: [500, 60000],
  discoverEvery: [1, 100],
  queriesPerTick: [1, 10],
  maxPendingQueue: [100, 100000],
};

/**
 * @param {Record<string, unknown>} input
 */
export function validateSettings(input) {
  const next = { ...DEFAULT_SETTINGS, ...input };
  for (const [key, range] of Object.entries(BOUNDS)) {
    const value = Number(next[key]);
    if (!Number.isFinite(value) || value < range[0] || value > range[1]) {
      throw new Error(`${key} must be between ${range[0]} and ${range[1]}`);
    }
    next[key] = Math.round(value);
  }
  next.autoDiscovery = Boolean(next.autoDiscovery);
  next.moderationRequired = Boolean(next.moderationRequired);
  next.defaultLanguage = String(next.defaultLanguage || "uz").slice(0, 8);
  next.defaultCategoryId = String(next.defaultCategoryId || "tech");
  next.duplicateHandling = ["skip", "update"].includes(String(next.duplicateHandling))
    ? String(next.duplicateHandling)
    : "skip";
  return next;
}

export async function getSettings() {
  const result = await query(
    `SELECT value FROM helper_state WHERE key = 'admin_settings'`,
  );
  if (!result.rows[0]) return { ...DEFAULT_SETTINGS };
  try {
    return validateSettings(JSON.parse(result.rows[0].value));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * @param {Record<string, unknown>} input
 */
export async function saveSettings(input) {
  const next = validateSettings(input);
  await query(
    `
    INSERT INTO helper_state (key, value, updated_at)
    VALUES ('admin_settings', $1, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [JSON.stringify(next)],
  );
  return next;
}

export async function isHelperPaused() {
  const result = await query(
    `SELECT value FROM helper_state WHERE key = 'helper_paused'`,
  );
  return result.rows[0]?.value === "1";
}

/**
 * @param {boolean} paused
 */
export async function setHelperPaused(paused) {
  await query(
    `
    INSERT INTO helper_state (key, value, updated_at)
    VALUES ('helper_paused', $1, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [paused ? "1" : "0"],
  );
}

/**
 * @param {Record<string, unknown>} payload
 */
export async function touchHelperHeartbeat(payload = {}) {
  await query(
    `
    INSERT INTO helper_state (key, value, updated_at)
    VALUES ('helper_heartbeat', $1, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [JSON.stringify({ ...payload, at: new Date().toISOString() })],
  );
}

export async function getHelperHeartbeat() {
  const result = await query(
    `SELECT value, updated_at FROM helper_state WHERE key = 'helper_heartbeat'`,
  );
  if (!result.rows[0]) return null;
  try {
    return {
      ...JSON.parse(result.rows[0].value),
      updatedAt: result.rows[0].updated_at,
    };
  } catch {
    return { updatedAt: result.rows[0].updated_at };
  }
}

/**
 * @param {string} key
 * @param {string} [fallback]
 */
export async function getState(key, fallback = "") {
  const result = await query(`SELECT value FROM helper_state WHERE key = $1`, [
    key,
  ]);
  return result.rows[0]?.value ?? fallback;
}

/**
 * @param {string} key
 * @param {string} value
 */
export async function setState(key, value) {
  await query(
    `
    INSERT INTO helper_state (key, value, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [key, value],
  );
}

/**
 * @param {{ actor?: string, action: string, entity?: string, entityId?: string|number, meta?: object, ip?: string }} entry
 */
export async function writeAudit(entry) {
  await query(
    `
    INSERT INTO admin_audit (actor, action, entity, entity_id, meta, ip)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6)
    `,
    [
      entry.actor || "admin",
      entry.action,
      entry.entity || null,
      entry.entityId != null ? String(entry.entityId) : null,
      JSON.stringify(entry.meta || {}),
      entry.ip || null,
    ],
  );
}

/**
 * @param {string} eventType
 * @param {object} [payload]
 */
export async function writeHelperEvent(eventType, payload = {}) {
  await query(
    `
    INSERT INTO helper_events (event_type, payload)
    VALUES ($1, $2::jsonb)
    `,
    [eventType, JSON.stringify(payload)],
  );
}
