import { query } from "./pool.js";

/**
 * @param {string} username
 */
export function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "")
    .replace(/^s\//i, "")
    .split(/[/?#]/)[0]
    .toLowerCase();
}

/**
 * @param {string} username
 * @param {{ source?: string, categoryHint?: string }} [options]
 */
export async function enqueueCandidate(username, options = {}) {
  const clean = normalizeUsername(username);
  if (!clean || !/^[a-zA-Z][a-zA-Z0-9_]{3,31}$/.test(clean)) {
    return null;
  }

  const result = await query(
    `
    INSERT INTO candidates (username, source, category_hint, query_id, status, dismissed)
    VALUES ($1, $2, $3, $4, 'pending', FALSE)
    ON CONFLICT (username) DO UPDATE SET
      updated_at = NOW(),
      dismissed = FALSE,
      status = CASE
        WHEN candidates.status IN ('failed', 'skipped') AND candidates.attempts < 8 THEN 'pending'
        WHEN candidates.dismissed = TRUE THEN 'pending'
        ELSE candidates.status
      END,
      category_hint = COALESCE(EXCLUDED.category_hint, candidates.category_hint),
      query_id = COALESCE(EXCLUDED.query_id, candidates.query_id)
    RETURNING id, username, status
    `,
    [
      clean,
      options.source || "manual",
      options.categoryHint || null,
      options.queryId || null,
    ],
  );
  return result.rows[0] || null;
}

/**
 * @param {string[]} usernames
 * @param {{ source?: string, categoryHint?: string }} [options]
 */
export async function enqueueMany(usernames, options = {}) {
  let added = 0;
  for (const username of usernames) {
    const row = await enqueueCandidate(username, options);
    if (row && row.status === "pending") added += 1;
  }
  return added;
}

/**
 * @param {number} [limit]
 */
export async function claimCandidates(limit = 10) {
  const result = await query(
    `
    WITH picked AS (
      SELECT id
      FROM candidates
      WHERE status = 'pending' AND dismissed = FALSE
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT $1
    )
    UPDATE candidates c
    SET status = 'processing',
        attempts = c.attempts + 1,
        updated_at = NOW()
    FROM picked
    WHERE c.id = picked.id
    RETURNING c.*
    `,
    [limit],
  );
  return result.rows;
}

/**
 * @param {number} id
 * @param {'done' | 'failed' | 'skipped'} status
 * @param {string} [error]
 */
export async function finishCandidate(id, status, error = "") {
  await query(
    `
    UPDATE candidates
    SET status = $2,
        last_error = NULLIF($3, ''),
        updated_at = NOW()
    WHERE id = $1
    `,
    [id, status, error],
  );
}

export async function getCandidateStats() {
  const result = await query(
    `
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'processing')::int AS processing,
      COUNT(*) FILTER (WHERE status = 'done')::int AS done,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      COUNT(*)::int AS total
    FROM candidates
    `,
  );
  return result.rows[0];
}

/**
 * @param {object} summary
 */
export async function startHelperRun() {
  const result = await query(
    `INSERT INTO helper_runs DEFAULT VALUES RETURNING id`,
  );
  return result.rows[0].id;
}

/**
 * @param {number} id
 * @param {{ processed: number, succeeded: number, failed: number, notes?: string }} summary
 */
export async function finishHelperRun(id, summary) {
  await query(
    `
    UPDATE helper_runs
    SET finished_at = NOW(),
        processed = $2,
        succeeded = $3,
        failed = $4,
        notes = $5
    WHERE id = $1
    `,
    [
      id,
      summary.processed,
      summary.succeeded,
      summary.failed,
      summary.notes || "",
    ],
  );
}

/**
 * Pull @usernames from community descriptions and enqueue them.
 * @param {number} [limit]
 */
export async function discoverFromDescriptions(limit = 50) {
  const result = await query(
    `
    SELECT username, description, category_id
    FROM communities
    WHERE status = 'active' AND description <> ''
    ORDER BY members_count DESC
    LIMIT $1
    `,
    [limit],
  );

  const mentionRe = /@([a-zA-Z][a-zA-Z0-9_]{3,31})/g;
  let added = 0;

  for (const row of result.rows) {
    const text = row.description || "";
    let match;
    while ((match = mentionRe.exec(text)) !== null) {
      const username = match[1].toLowerCase();
      if (username === row.username.toLowerCase()) continue;
      const enqueued = await enqueueCandidate(username, {
        source: "mention",
        categoryHint: row.category_id || undefined,
      });
      if (enqueued && enqueued.status === "pending") added += 1;
    }
  }

  return added;
}
