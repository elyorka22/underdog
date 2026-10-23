/**
 * @param {import('pg').QueryResultRow} row
 */
export function mapCommunity(row) {
  return {
    id: row.id,
    username: row.username,
    title: row.title,
    description: row.description || "",
    type: row.type,
    categoryId: row.category_id || "tech",
    categoryTitle: row.category_title || row.category_id || "",
    language: row.language || "uz",
    membersCount: Number(row.members_count || 0),
    tags: Array.isArray(row.tags) ? row.tags : [],
    verified: Boolean(row.verified),
    telegramUrl: `https://t.me/${row.username}`,
    status: row.status || "active",
    source: row.source || "seed",
  };
}

/**
 * @param {import('pg').QueryResultRow} row
 */
export function mapCategory(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    count: Number(row.count || 0),
  };
}
