import { query } from "./pool.js";
import { mapCategory, mapCommunity } from "./mappers.js";

/**
 * @typedef {object} SearchParams
 * @property {string} [q]
 * @property {'channel' | 'group' | 'all'} [type]
 * @property {string} [category]
 * @property {string} [language]
 * @property {string} [sort]
 * @property {number} [limit]
 * @property {number} [offset]
 */

/**
 * @param {SearchParams} params
 */
export async function searchCommunities(params = {}) {
  const q = (params.q || "").trim();
  const type = params.type || "all";
  const category = params.category || "all";
  const language = params.language || "all";
  const sort = params.sort || "members";
  const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 50);
  const offset = Math.max(Number(params.offset) || 0, 0);

  const where = ["c.status = 'active'"];
  const values = [];

  if (type !== "all") {
    values.push(type);
    where.push(`c.type = $${values.length}`);
  }
  if (category !== "all") {
    values.push(category);
    where.push(`c.category_id = $${values.length}`);
  }
  if (language !== "all") {
    values.push(language);
    where.push(`c.language = $${values.length}`);
  }
  if (q) {
    values.push(`%${q.toLowerCase()}%`);
    const idx = values.length;
    where.push(
      `(LOWER(c.title) LIKE $${idx} OR LOWER(c.username) LIKE $${idx} OR LOWER(c.description) LIKE $${idx} OR EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE LOWER(t) LIKE $${idx}))`,
    );
  }

  let orderBy = "c.members_count DESC";
  if (sort === "title") orderBy = "c.title ASC";
  if (sort === "newest") orderBy = "c.created_at DESC";

  const whereSql = where.join(" AND ");

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM communities c WHERE ${whereSql}`,
    values,
  );

  values.push(limit);
  const limitIdx = values.length;
  values.push(offset);
  const offsetIdx = values.length;

  const result = await query(
    `
    SELECT c.*, cat.title AS category_title
    FROM communities c
    LEFT JOIN categories cat ON cat.id = c.category_id
    WHERE ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `,
    values,
  );

  return {
    total: countResult.rows[0]?.total || 0,
    limit,
    offset,
    items: result.rows.map(mapCommunity),
  };
}

/**
 * @param {string} idOrUsername
 */
export async function getCommunity(idOrUsername) {
  const key = idOrUsername.trim().toLowerCase();
  const result = await query(
    `
    SELECT c.*, cat.title AS category_title
    FROM communities c
    LEFT JOIN categories cat ON cat.id = c.category_id
    WHERE c.id = $1 OR LOWER(c.username) = $1
    LIMIT 1
    `,
    [key],
  );
  return result.rows[0] ? mapCommunity(result.rows[0]) : null;
}

export async function listCategories() {
  const result = await query(
    `
    SELECT cat.id, cat.title, cat.description,
      COUNT(c.id) FILTER (WHERE c.status = 'active')::int AS count
    FROM categories cat
    LEFT JOIN communities c ON c.category_id = cat.id
    GROUP BY cat.id, cat.title, cat.description
    ORDER BY cat.title ASC
    `,
  );
  return result.rows.map(mapCategory);
}

/**
 * @param {string} categoryId
 * @param {number} [limit]
 */
export async function listByCategory(categoryId, limit = 20) {
  return searchCommunities({ category: categoryId, limit, sort: "members" });
}

/**
 * @param {number} [limit]
 */
export async function listPopular(limit = 8) {
  return searchCommunities({ limit, sort: "members" });
}

export async function getStats() {
  const result = await query(
    `
    SELECT
      COUNT(*) FILTER (WHERE status = 'active')::int AS total,
      COUNT(*) FILTER (WHERE status = 'active' AND type = 'channel')::int AS channels,
      COUNT(*) FILTER (WHERE status = 'active' AND type = 'group')::int AS groups,
      (SELECT COUNT(*)::int FROM categories) AS categories
    FROM communities
    `,
  );
  return result.rows[0];
}

/**
 * @param {object} item
 */
export async function upsertCommunity(item) {
  const id = item.id || `tg_${String(item.username).toLowerCase()}`;
  await query(
    `
    INSERT INTO communities (
      id, username, title, description, type, category_id, language,
      members_count, tags, verified, telegram_id, status, source,
      discovery_query_id, last_checked_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, COALESCE($7, 'uz'),
      $8, $9, $10, $11, $12, $13,
      $14, NOW(), NOW()
    )
    ON CONFLICT (username) DO UPDATE SET
      title = EXCLUDED.title,
      description = COALESCE(NULLIF(EXCLUDED.description, ''), communities.description),
      type = EXCLUDED.type,
      category_id = COALESCE(EXCLUDED.category_id, communities.category_id),
      language = COALESCE($7, communities.language),
      members_count = GREATEST(EXCLUDED.members_count, communities.members_count),
      tags = CASE
        WHEN cardinality(EXCLUDED.tags) > 0 THEN EXCLUDED.tags
        ELSE communities.tags
      END,
      verified = EXCLUDED.verified OR communities.verified,
      telegram_id = COALESCE(EXCLUDED.telegram_id, communities.telegram_id),
      status = EXCLUDED.status,
      discovery_query_id = COALESCE(EXCLUDED.discovery_query_id, communities.discovery_query_id),
      source = CASE
        WHEN communities.source = 'seed' AND EXCLUDED.source <> 'seed' THEN EXCLUDED.source
        ELSE communities.source
      END,
      last_checked_at = NOW(),
      updated_at = NOW()
    `,
    [
      id,
      String(item.username).replace(/^@/, "").toLowerCase(),
      item.title,
      item.description || "",
      item.type,
      item.categoryId || null,
      item.language || null,
      Number(item.membersCount || 0),
      item.tags || [],
      Boolean(item.verified),
      item.telegramId || null,
      item.status || "active",
      item.source || "helper",
      item.discoveryQueryId || null,
    ],
  );
  return id;
}

/**
 * @param {string} username
 * @param {string} [status]
 * @param {string} [error]
 */
export async function markCommunityStatus(username, status, error = "") {
  await query(
    `
    UPDATE communities
    SET status = $2,
        last_checked_at = NOW(),
        updated_at = NOW(),
        description = CASE
          WHEN $3 <> '' AND description = '' THEN $3
          ELSE description
        END
    WHERE LOWER(username) = LOWER($1)
    `,
    [username, status, error],
  );
}
