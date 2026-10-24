import { query } from "./pool.js";
import { mapCommunity } from "./mappers.js";
import { getCandidateStats } from "./candidates.js";
import { getHelperHeartbeat, getSettings, isHelperPaused } from "./settings.js";

/**
 * @param {string} [range]
 */
function rangeInterval(range = "7d") {
  if (range === "24h") return "24 hours";
  if (range === "30d") return "30 days";
  if (range === "7d") return "7 days";
  return "7 days";
}

/**
 * @param {string} [range]
 */
export async function getDashboard(range = "7d") {
  const interval = rangeInterval(range);
  const [
    stats,
    candidates,
    added24h,
    added7d,
    addedRange,
    runs,
    byCategory,
    topQueries,
    recentEvents,
    heartbeat,
    paused,
    settings,
  ] = await Promise.all([
    query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'active')::int AS total,
        COUNT(*) FILTER (WHERE status = 'active' AND type = 'channel')::int AS channels,
        COUNT(*) FILTER (WHERE status = 'active' AND type = 'group')::int AS groups,
        COUNT(*) FILTER (WHERE status = 'active' AND type = 'bot')::int AS bots
      FROM communities
      `,
    ),
    getCandidateStats(),
    query(
      `SELECT COUNT(*)::int AS n FROM communities WHERE created_at >= NOW() - INTERVAL '24 hours'`,
    ),
    query(
      `SELECT COUNT(*)::int AS n FROM communities WHERE created_at >= NOW() - INTERVAL '7 days'`,
    ),
    query(
      `SELECT COUNT(*)::int AS n FROM communities WHERE created_at >= NOW() - INTERVAL '${interval}'`,
    ),
    query(
      `
      SELECT
        COUNT(*)::int AS runs,
        COALESCE(SUM(processed),0)::int AS processed,
        COALESCE(SUM(succeeded),0)::int AS succeeded,
        COALESCE(SUM(failed),0)::int AS failed
      FROM helper_runs
      WHERE started_at >= NOW() - INTERVAL '${interval}'
      `,
    ),
    query(
      `
      SELECT COALESCE(cat.title, c.category_id, 'unknown') AS category, COUNT(*)::int AS count
      FROM communities c
      LEFT JOIN categories cat ON cat.id = c.category_id
      WHERE c.status = 'active' AND c.created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 12
      `,
    ),
    query(
      `
      SELECT id, query, language, candidates_found, communities_found, times_run, times_empty, last_run_at
      FROM discovery_queries
      ORDER BY communities_found DESC, candidates_found DESC
      LIMIT 10
      `,
    ),
    query(
      `
      SELECT id, event_type, payload, created_at
      FROM helper_events
      ORDER BY created_at DESC
      LIMIT 20
      `,
    ),
    getHelperHeartbeat(),
    isHelperPaused(),
    getSettings(),
  ]);

  const runStats = runs.rows[0];
  const succeeded = Number(runStats.succeeded || 0);
  const failed = Number(runStats.failed || 0);
  const totalDone = succeeded + failed;

  return {
    range,
    communities: {
      total: stats.rows[0].total,
      channels: stats.rows[0].channels,
      groups: stats.rows[0].groups,
      bots: stats.rows[0].bots,
      added24h: added24h.rows[0].n,
      added7d: added7d.rows[0].n,
      addedInRange: addedRange.rows[0].n,
    },
    candidates,
    runs: {
      count: runStats.runs,
      processed: runStats.processed,
      succeeded,
      failed,
      successRate: totalDone ? Math.round((succeeded / totalDone) * 1000) / 10 : null,
    },
    byCategory: byCategory.rows,
    topQueries: topQueries.rows,
    recentEvents: recentEvents.rows.map((row) => ({
      id: Number(row.id),
      type: row.event_type,
      payload: row.payload,
      createdAt: row.created_at,
    })),
    helper: {
      paused,
      heartbeat,
      autoDiscovery: settings.autoDiscovery,
      settings,
    },
  };
}

export async function getHelperStatus() {
  const [heartbeat, paused, settings, candidates, lastRun] = await Promise.all([
    getHelperHeartbeat(),
    isHelperPaused(),
    getSettings(),
    getCandidateStats(),
    query(
      `
      SELECT *
      FROM helper_runs
      ORDER BY started_at DESC
      LIMIT 1
      `,
    ),
  ]);

  const updatedAt = heartbeat?.updatedAt
    ? new Date(heartbeat.updatedAt).getTime()
    : 0;
  const ageMs = updatedAt ? Date.now() - updatedAt : null;
  let status = "unknown";
  if (paused) status = "paused";
  else if (ageMs != null && ageMs < Math.max(settings.intervalMs * 3, 180000)) {
    status = "running";
  } else if (ageMs != null) status = "degraded";
  else status = "unknown";

  return {
    status,
    paused,
    heartbeat,
    ageMs,
    settings,
    candidates,
    lastRun: lastRun.rows[0] || null,
    mtprotoConfiguredHint: "Check helper logs/env; secrets are not exposed",
  };
}

/**
 * @param {object} filters
 */
export async function listAdminCandidates(filters = {}) {
  const limit = Math.min(Math.max(Number(filters.limit) || 30, 1), 100);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  const where = ["TRUE"];
  const values = [];

  if (filters.status) {
    values.push(filters.status);
    where.push(`c.status = $${values.length}`);
  }
  if (filters.source) {
    values.push(filters.source);
    where.push(`c.source = $${values.length}`);
  }
  if (filters.dismissed != null) {
    values.push(Boolean(filters.dismissed));
    where.push(`c.dismissed = $${values.length}`);
  } else {
    where.push(`c.dismissed = FALSE`);
  }
  if (filters.q) {
    values.push(`%${String(filters.q).toLowerCase()}%`);
    where.push(
      `(LOWER(c.username) LIKE $${values.length} OR LOWER(COALESCE(c.title,'')) LIKE $${values.length})`,
    );
  }
  if (filters.failedOnly) {
    where.push(`c.status = 'failed'`);
  }

  const count = await query(
    `SELECT COUNT(*)::int AS total FROM candidates c WHERE ${where.join(" AND ")}`,
    values,
  );
  values.push(limit);
  const limitIdx = values.length;
  values.push(offset);
  const offsetIdx = values.length;

  const result = await query(
    `
    SELECT c.*, q.query AS source_query
    FROM candidates c
    LEFT JOIN discovery_queries q ON q.id = c.query_id
    WHERE ${where.join(" AND ")}
    ORDER BY c.updated_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `,
    values,
  );

  return {
    total: count.rows[0].total,
    limit,
    offset,
    items: result.rows.map((row) => ({
      id: Number(row.id),
      username: row.username,
      title: row.title,
      source: row.source,
      sourceQuery: row.source_query,
      categoryHint: row.category_hint,
      status: row.status,
      attempts: Number(row.attempts || 0),
      lastError: row.last_error,
      dismissed: Boolean(row.dismissed),
      queryId: row.query_id ? Number(row.query_id) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

/**
 * @param {number[]} ids
 */
export async function retryCandidates(ids) {
  if (!ids.length) return 0;
  const result = await query(
    `
    UPDATE candidates
    SET status = 'pending',
        dismissed = FALSE,
        last_error = NULL,
        updated_at = NOW()
    WHERE id = ANY($1::bigint[])
      AND status IN ('failed', 'skipped', 'done')
    RETURNING id
    `,
    [ids],
  );
  return result.rows.length;
}

/**
 * @param {number[]} ids
 */
export async function dismissCandidates(ids) {
  if (!ids.length) return 0;
  const result = await query(
    `
    UPDATE candidates
    SET dismissed = TRUE, updated_at = NOW()
    WHERE id = ANY($1::bigint[])
    RETURNING id
    `,
    [ids],
  );
  return result.rows.length;
}

/**
 * @param {object} filters
 */
export async function listAdminCommunities(filters = {}) {
  const limit = Math.min(Math.max(Number(filters.limit) || 30, 1), 100);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  const where = ["TRUE"];
  const values = [];

  if (filters.q) {
    values.push(`%${String(filters.q).toLowerCase()}%`);
    where.push(
      `(LOWER(c.title) LIKE $${values.length} OR LOWER(c.username) LIKE $${values.length})`,
    );
  }
  if (filters.categoryId) {
    values.push(filters.categoryId);
    where.push(`c.category_id = $${values.length}`);
  }
  if (filters.type) {
    values.push(filters.type);
    where.push(`c.type = $${values.length}`);
  }
  if (filters.language) {
    values.push(filters.language);
    where.push(`c.language = $${values.length}`);
  }
  if (filters.flagged != null) {
    values.push(Boolean(filters.flagged));
    where.push(`c.flagged = $${values.length}`);
  }
  if (filters.visibility) {
    values.push(filters.visibility);
    where.push(`c.visibility = $${values.length}`);
  }

  const count = await query(
    `SELECT COUNT(*)::int AS total FROM communities c WHERE ${where.join(" AND ")}`,
    values,
  );
  values.push(limit);
  const li = values.length;
  values.push(offset);
  const oi = values.length;

  const result = await query(
    `
    SELECT c.*, cat.title AS category_title, q.query AS discovery_query
    FROM communities c
    LEFT JOIN categories cat ON cat.id = c.category_id
    LEFT JOIN discovery_queries q ON q.id = c.discovery_query_id
    WHERE ${where.join(" AND ")}
    ORDER BY c.created_at DESC
    LIMIT $${li} OFFSET $${oi}
    `,
    values,
  );

  return {
    total: count.rows[0].total,
    limit,
    offset,
    items: result.rows.map((row) => ({
      ...mapCommunity(row),
      flagged: Boolean(row.flagged),
      visibility: row.visibility || "public",
      discoveryQuery: row.discovery_query || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

/**
 * @param {string} id
 * @param {object} patch
 */
export async function updateAdminCommunity(id, patch) {
  const result = await query(
    `
    UPDATE communities SET
      flagged = COALESCE($2, flagged),
      visibility = COALESCE($3, visibility),
      category_id = COALESCE($4, category_id),
      updated_at = NOW()
    WHERE id = $1 OR LOWER(username) = LOWER($1)
    RETURNING *
    `,
    [
      id,
      patch.flagged == null ? null : Boolean(patch.flagged),
      patch.visibility || null,
      patch.categoryId || null,
    ],
  );
  return result.rows[0] ? mapCommunity(result.rows[0]) : null;
}

/**
 * @param {string} [range]
 */
export async function getAnalytics(range = "7d") {
  const interval = rangeInterval(range);
  const [dailyAdds, dailyRuns, byCategory, byLanguage, byQuery, failures] =
    await Promise.all([
      query(
        `
        SELECT DATE(created_at) AS day, COUNT(*)::int AS count
        FROM communities
        WHERE created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY 1
        ORDER BY 1
        `,
      ),
      query(
        `
        SELECT DATE(started_at) AS day,
          COALESCE(SUM(processed),0)::int AS processed,
          COALESCE(SUM(succeeded),0)::int AS succeeded,
          COALESCE(SUM(failed),0)::int AS failed
        FROM helper_runs
        WHERE started_at >= NOW() - INTERVAL '${interval}'
        GROUP BY 1
        ORDER BY 1
        `,
      ),
      query(
        `
        SELECT COALESCE(cat.title, c.category_id, 'unknown') AS label, COUNT(*)::int AS count
        FROM communities c
        LEFT JOIN categories cat ON cat.id = c.category_id
        WHERE c.created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY 1 ORDER BY count DESC
        `,
      ),
      query(
        `
        SELECT COALESCE(language, 'unknown') AS label, COUNT(*)::int AS count
        FROM communities
        WHERE created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY 1 ORDER BY count DESC
        `,
      ),
      query(
        `
        SELECT query AS label, candidates_found, communities_found, times_run, times_empty
        FROM discovery_queries
        ORDER BY communities_found DESC, candidates_found DESC
        LIMIT 20
        `,
      ),
      query(
        `
        SELECT COALESCE(last_error, 'unknown') AS label, COUNT(*)::int AS count
        FROM candidates
        WHERE status = 'failed' AND updated_at >= NOW() - INTERVAL '${interval}'
        GROUP BY 1
        ORDER BY count DESC
        LIMIT 15
        `,
      ),
    ]);

  return {
    range,
    dailyAdds: dailyAdds.rows,
    dailyRuns: dailyRuns.rows,
    byCategory: byCategory.rows,
    byLanguage: byLanguage.rows,
    byQuery: byQuery.rows,
    failures: failures.rows,
  };
}

/**
 * @param {object} [filters]
 */
export async function listAudit(filters = {}) {
  const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200);
  const result = await query(
    `
    SELECT * FROM admin_audit
    ORDER BY created_at DESC
    LIMIT $1
    `,
    [limit],
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    actor: row.actor,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    meta: row.meta,
    ip: row.ip,
    createdAt: row.created_at,
  }));
}

export async function listHelperRuns(limit = 30) {
  const result = await query(
    `
    SELECT *
    FROM helper_runs
    ORDER BY started_at DESC
    LIMIT $1
    `,
    [limit],
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    processed: Number(row.processed || 0),
    succeeded: Number(row.succeeded || 0),
    failed: Number(row.failed || 0),
    notes: row.notes,
    durationMs:
      row.finished_at && row.started_at
        ? new Date(row.finished_at).getTime() - new Date(row.started_at).getTime()
        : null,
  }));
}

export async function listRecentEvents(limit = 50) {
  const result = await query(
    `
    SELECT id, event_type, payload, created_at
    FROM helper_events
    ORDER BY created_at DESC
    LIMIT $1
    `,
    [limit],
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    type: row.event_type,
    payload: sanitizePayload(row.payload),
    createdAt: row.created_at,
  }));
}

/**
 * @param {any} payload
 */
function sanitizePayload(payload) {
  if (!payload || typeof payload !== "object") return {};
  const clone = { ...payload };
  for (const key of Object.keys(clone)) {
    if (/token|session|password|secret|hash|authorization/i.test(key)) {
      clone[key] = "[redacted]";
    }
  }
  return clone;
}

/**
 * Force process command flags for helper via DB.
 * @param {'discover' | 'process_queue' | null} command
 */
export async function setHelperCommand(command) {
  await query(
    `
    INSERT INTO helper_state (key, value, updated_at)
    VALUES ('helper_command', $1, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [command || ""],
  );
}

export async function consumeHelperCommand() {
  const result = await query(
    `SELECT value FROM helper_state WHERE key = 'helper_command'`,
  );
  const value = result.rows[0]?.value || "";
  if (!value) return null;
  await query(
    `
    UPDATE helper_state SET value = '', updated_at = NOW()
    WHERE key = 'helper_command'
    `,
  );
  return value;
}
