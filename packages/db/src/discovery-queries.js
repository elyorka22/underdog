import { query } from "./pool.js";

const SUGGESTED = [
  { query: "dasturlash", language: "uz", categoryId: "tech" },
  { query: "IT", language: "uz", categoryId: "tech" },
  { query: "sun'iy intellekt", language: "uz", categoryId: "ai" },
  { query: "ish e'lonlari", language: "uz", categoryId: "jobs" },
  { query: "frilans", language: "uz", categoryId: "freelance" },
  { query: "ta'lim", language: "uz", categoryId: "education" },
  { query: "ingliz tili", language: "uz", categoryId: "languages" },
  { query: "biznes", language: "uz", categoryId: "business" },
  { query: "startap", language: "uz", categoryId: "startups" },
  { query: "marketing", language: "uz", categoryId: "marketing" },
  { query: "dizayn", language: "uz", categoryId: "design" },
  { query: "kripto", language: "uz", categoryId: "crypto" },
  { query: "investitsiya", language: "uz", categoryId: "investing" },
  { query: "yangiliklar", language: "uz", categoryId: "news" },
  { query: "kino", language: "uz", categoryId: "movies" },
  { query: "musiqa", language: "uz", categoryId: "music" },
  { query: "futbol", language: "uz", categoryId: "football" },
  { query: "ovqat", language: "uz", categoryId: "food" },
  { query: "sayohat", language: "uz", categoryId: "travel" },
  { query: "avtomobil", language: "uz", categoryId: "cars" },
  { query: "uy joy", language: "uz", categoryId: "realestate" },
  { query: "toshkent", language: "uz", categoryId: "tashkent" },
  { query: "memlar", language: "uz", categoryId: "memes" },
  { query: "salomatlik", language: "uz", categoryId: "health" },
  { query: "sport", language: "uz", categoryId: "fitness" },
  { query: "программирование", language: "ru", categoryId: "tech" },
  { query: "искусственный интеллект", language: "ru", categoryId: "ai" },
  { query: "вакансии", language: "ru", categoryId: "jobs" },
  { query: "фриланс", language: "ru", categoryId: "freelance" },
  { query: "образование", language: "ru", categoryId: "education" },
  { query: "английский язык", language: "ru", categoryId: "languages" },
  { query: "бизнес", language: "ru", categoryId: "business" },
  { query: "стартапы", language: "ru", categoryId: "startups" },
  { query: "маркетинг", language: "ru", categoryId: "marketing" },
  { query: "дизайн", language: "ru", categoryId: "design" },
  { query: "криптовалюта", language: "ru", categoryId: "crypto" },
  { query: "инвестиции", language: "ru", categoryId: "investing" },
  { query: "новости", language: "ru", categoryId: "news" },
  { query: "фильмы", language: "ru", categoryId: "movies" },
  { query: "музыка", language: "ru", categoryId: "music" },
  { query: "футбол", language: "ru", categoryId: "football" },
  { query: "рецепты", language: "ru", categoryId: "food" },
  { query: "путешествия", language: "ru", categoryId: "travel" },
  { query: "автомобили", language: "ru", categoryId: "cars" },
  { query: "недвижимость", language: "ru", categoryId: "realestate" },
  { query: "мемы", language: "ru", categoryId: "memes" },
  { query: "здоровье", language: "ru", categoryId: "health" },
  { query: "фитнес", language: "ru", categoryId: "fitness" },
  { query: "programming", language: "en", categoryId: "tech" },
  { query: "artificial intelligence", language: "en", categoryId: "ai" },
  { query: "jobs", language: "en", categoryId: "jobs" },
  { query: "freelance", language: "en", categoryId: "freelance" },
  { query: "education", language: "en", categoryId: "education" },
  { query: "english learning", language: "en", categoryId: "languages" },
  { query: "business", language: "en", categoryId: "business" },
  { query: "startups", language: "en", categoryId: "startups" },
  { query: "marketing", language: "en", categoryId: "marketing" },
  { query: "design", language: "en", categoryId: "design" },
  { query: "crypto", language: "en", categoryId: "crypto" },
  { query: "investing", language: "en", categoryId: "investing" },
  { query: "news", language: "en", categoryId: "news" },
  { query: "movies", language: "en", categoryId: "movies" },
  { query: "music", language: "en", categoryId: "music" },
  { query: "football", language: "en", categoryId: "football" },
  { query: "recipes", language: "en", categoryId: "food" },
  { query: "travel", language: "en", categoryId: "travel" },
  { query: "cars", language: "en", categoryId: "cars" },
  { query: "real estate", language: "en", categoryId: "realestate" },
  { query: "memes", language: "en", categoryId: "memes" },
  { query: "health", language: "en", categoryId: "health" },
  { query: "fitness", language: "en", categoryId: "fitness" },
  { query: "gamedev", language: "en", categoryId: "games" },
  { query: "python", language: "en", categoryId: "tech" },
  { query: "smm", language: "en", categoryId: "marketing" },
];

/**
 * @param {import('pg').QueryResultRow} row
 */
function mapQuery(row) {
  return {
    id: Number(row.id),
    query: row.query,
    categoryId: row.category_id,
    categoryTitle: row.category_title || null,
    language: row.language,
    synonyms: row.synonyms || [],
    enabled: Boolean(row.enabled),
    priority: Number(row.priority || 100),
    autoRun: Boolean(row.auto_run),
    timesRun: Number(row.times_run || 0),
    timesEmpty: Number(row.times_empty || 0),
    candidatesFound: Number(row.candidates_found || 0),
    communitiesFound: Number(row.communities_found || 0),
    lastRunAt: row.last_run_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function seedDiscoveryQueries() {
  for (const item of SUGGESTED) {
    const exists = await query(
      `
      SELECT id FROM discovery_queries
      WHERE LOWER(query) = LOWER($1) AND language = $2
      LIMIT 1
      `,
      [item.query, item.language],
    );
    if (!exists.rows[0]) {
      await query(
        `
        INSERT INTO discovery_queries (query, category_id, language, enabled, priority, auto_run)
        VALUES ($1, $2, $3, TRUE, 100, TRUE)
        `,
        [item.query, item.categoryId, item.language],
      );
    }
  }
}

/**
 * @param {object} [filters]
 */
export async function listDiscoveryQueries(filters = {}) {
  const where = ["TRUE"];
  const values = [];

  if (filters.enabled != null) {
    values.push(Boolean(filters.enabled));
    where.push(`q.enabled = $${values.length}`);
  }
  if (filters.language) {
    values.push(filters.language);
    where.push(`q.language = $${values.length}`);
  }
  if (filters.categoryId) {
    values.push(filters.categoryId);
    where.push(`q.category_id = $${values.length}`);
  }
  if (filters.q) {
    values.push(`%${String(filters.q).toLowerCase()}%`);
    where.push(
      `(LOWER(q.query) LIKE $${values.length} OR EXISTS (SELECT 1 FROM unnest(q.synonyms) s WHERE LOWER(s) LIKE $${values.length}))`,
    );
  }

  const result = await query(
    `
    SELECT q.*, cat.title AS category_title
    FROM discovery_queries q
    LEFT JOIN categories cat ON cat.id = q.category_id
    WHERE ${where.join(" AND ")}
    ORDER BY q.priority DESC, q.id ASC
    `,
    values,
  );
  return result.rows.map(mapQuery);
}

/**
 * @param {number} [limit]
 */
export async function listRunnableQueries(limit = 200) {
  const result = await query(
    `
    SELECT q.*, cat.title AS category_title
    FROM discovery_queries q
    LEFT JOIN categories cat ON cat.id = q.category_id
    WHERE q.enabled = TRUE AND q.auto_run = TRUE
    ORDER BY q.priority DESC, q.id ASC
    LIMIT $1
    `,
    [limit],
  );
  return result.rows.map(mapQuery);
}

/**
 * @param {number} id
 */
export async function getDiscoveryQuery(id) {
  const result = await query(
    `
    SELECT q.*, cat.title AS category_title
    FROM discovery_queries q
    LEFT JOIN categories cat ON cat.id = q.category_id
    WHERE q.id = $1
    `,
    [id],
  );
  return result.rows[0] ? mapQuery(result.rows[0]) : null;
}

/**
 * @param {object} input
 */
export async function createDiscoveryQuery(input) {
  const result = await query(
    `
    INSERT INTO discovery_queries (
      query, category_id, language, synonyms, enabled, priority, auto_run
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      String(input.query).trim(),
      input.categoryId || null,
      input.language || "uz",
      input.synonyms || [],
      input.enabled !== false,
      Number(input.priority || 100),
      input.autoRun !== false,
    ],
  );
  return mapQuery(result.rows[0]);
}

/**
 * @param {number} id
 * @param {object} input
 */
export async function updateDiscoveryQuery(id, input) {
  const current = await getDiscoveryQuery(id);
  if (!current) return null;
  const next = {
    query: input.query != null ? String(input.query).trim() : current.query,
    categoryId:
      input.categoryId !== undefined ? input.categoryId : current.categoryId,
    language: input.language != null ? input.language : current.language,
    synonyms: input.synonyms != null ? input.synonyms : current.synonyms,
    enabled: input.enabled != null ? Boolean(input.enabled) : current.enabled,
    priority:
      input.priority != null ? Number(input.priority) : current.priority,
    autoRun: input.autoRun != null ? Boolean(input.autoRun) : current.autoRun,
  };
  const result = await query(
    `
    UPDATE discovery_queries SET
      query = $2,
      category_id = $3,
      language = $4,
      synonyms = $5,
      enabled = $6,
      priority = $7,
      auto_run = $8,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      id,
      next.query,
      next.categoryId,
      next.language,
      next.synonyms,
      next.enabled,
      next.priority,
      next.autoRun,
    ],
  );
  return mapQuery(result.rows[0]);
}

/**
 * @param {number} id
 */
export async function deleteDiscoveryQuery(id) {
  await query(`DELETE FROM discovery_queries WHERE id = $1`, [id]);
}

/**
 * @param {number} id
 * @param {{ empty?: boolean, candidates?: number, communities?: number, error?: string }} stats
 */
export async function recordQueryRun(id, stats = {}) {
  await query(
    `
    UPDATE discovery_queries SET
      times_run = times_run + 1,
      times_empty = times_empty + CASE WHEN $2 THEN 1 ELSE 0 END,
      candidates_found = candidates_found + $3,
      communities_found = communities_found + $4,
      last_run_at = NOW(),
      last_error = $5,
      updated_at = NOW()
    WHERE id = $1
    `,
    [
      id,
      Boolean(stats.empty),
      Number(stats.candidates || 0),
      Number(stats.communities || 0),
      stats.error || null,
    ],
  );
}
