import { query } from "./pool.js";

export const DEFAULT_SETTINGS = {
  autoDiscovery: true,
  batchSize: 8,
  intervalMs: 60000,
  delayMs: 2000,
  concurrency: 3,
  discoverEvery: 1,
  queriesPerTick: 2,
  maxPendingQueue: 5000,
  drainPendingThreshold: 150,
  defaultLanguage: "uz",
  defaultCategoryId: "tech",
  duplicateHandling: "skip",
  moderationRequired: false,
};

const BOUNDS = {
  batchSize: [1, 100],
  intervalMs: [5000, 3600000],
  delayMs: [100, 60000],
  concurrency: [1, 8],
  discoverEvery: [1, 100],
  queriesPerTick: [1, 10],
  maxPendingQueue: [100, 100000],
  drainPendingThreshold: [20, 10000],
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

/** Preset to clear a large pending queue faster. */
export function turboDrainSettings(current = {}) {
  return validateSettings({
    ...DEFAULT_SETTINGS,
    ...current,
    autoDiscovery: false,
    batchSize: 40,
    concurrency: 5,
    delayMs: 250,
    intervalMs: 8000,
    discoverEvery: 20,
    queriesPerTick: 1,
    drainPendingThreshold: 80,
  });
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

const FOCUS_TYPES = new Set(["channel", "group", "bot", "all"]);

/**
 * Active admin focus: helper searches only this category/type until `until`.
 * @returns {Promise<null | {
 *   categoryId: string,
 *   categoryTitle: string,
 *   type: 'channel'|'group'|'bot'|'all',
 *   minutes: number,
 *   startedAt: string,
 *   until: string,
 *   remainingMs: number,
 * }>}
 */
export async function getHelperFocus() {
  const raw = await getState("helper_focus", "");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.categoryId || !parsed?.until) return null;
    const untilMs = new Date(parsed.until).getTime();
    if (!Number.isFinite(untilMs) || untilMs <= Date.now()) {
      await clearHelperFocus();
      return null;
    }
    return {
      categoryId: String(parsed.categoryId),
      categoryTitle: String(parsed.categoryTitle || parsed.categoryId),
      type: FOCUS_TYPES.has(parsed.type) ? parsed.type : "all",
      minutes: Number(parsed.minutes) || 0,
      startedAt: String(parsed.startedAt || ""),
      until: String(parsed.until),
      remainingMs: untilMs - Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * @param {{ categoryId: string, categoryTitle?: string, type?: string, minutes: number }} input
 */
export async function setHelperFocus(input) {
  const categoryId = String(input.categoryId || "").trim();
  if (!categoryId) throw new Error("categoryId is required");

  const minutes = Math.round(Number(input.minutes));
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 720) {
    throw new Error("minutes must be between 1 and 720");
  }

  const type = FOCUS_TYPES.has(input.type) ? String(input.type) : "all";
  const startedAt = new Date();
  const until = new Date(startedAt.getTime() + minutes * 60_000);
  const payload = {
    categoryId,
    categoryTitle: String(input.categoryTitle || categoryId),
    type,
    minutes,
    startedAt: startedAt.toISOString(),
    until: until.toISOString(),
  };

  await setState("helper_focus", JSON.stringify(payload));
  await writeHelperEvent("helper_focus_set", payload);
  return {
    ...payload,
    remainingMs: minutes * 60_000,
  };
}

export async function clearHelperFocus() {
  await setState("helper_focus", "");
  await writeHelperEvent("helper_focus_clear", {});
  return { ok: true };
}
