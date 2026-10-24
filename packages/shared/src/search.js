import { categories } from "./categories.js";
import { communities } from "./seed.js";

/**
 * @typedef {object} SearchParams
 * @property {string} [q]
 * @property {'channel' | 'group' | 'bot' | 'all'} [type]
 * @property {string} [category]
 * @property {string} [language]
 * @property {string} [sort]
 * @property {number} [limit]
 * @property {number} [offset]
 */

/**
 * @param {string} value
 */
function normalize(value) {
  return value.trim().toLowerCase();
}

/**
 * @param {import('./seed.js').Community} item
 * @param {string} query
 */
function matchesQuery(item, query) {
  if (!query) return true;
  const haystack = [
    item.title,
    item.username,
    item.description,
    item.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return query.split(/\s+/).every((token) => haystack.includes(token));
}

/**
 * @param {SearchParams} params
 */
export function searchCommunities(params = {}) {
  const q = normalize(params.q || "");
  const type = params.type || "all";
  const category = params.category || "all";
  const language = params.language || "all";
  const sort = params.sort || "members";
  const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 50);
  const offset = Math.max(Number(params.offset) || 0, 0);

  let items = communities.filter((item) => {
    if (type !== "all" && item.type !== type) return false;
    if (category !== "all" && item.categoryId !== category) return false;
    if (language !== "all" && item.language !== language) return false;
    return matchesQuery(item, q);
  });

  items = [...items].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title, "ru");
    if (sort === "newest") return b.id.localeCompare(a.id);
    return b.membersCount - a.membersCount;
  });

  const total = items.length;
  const page = items.slice(offset, offset + limit).map(enrichCommunity);

  return {
    total,
    limit,
    offset,
    items: page,
  };
}

/**
 * @param {string} idOrUsername
 */
export function getCommunity(idOrUsername) {
  const key = normalize(idOrUsername);
  const found = communities.find(
    (item) => item.id === key || normalize(item.username) === key,
  );
  return found ? enrichCommunity(found) : null;
}

/**
 * @param {{ type?: string }} [filters]
 */
export function listCategories(filters = {}) {
  const type = filters.type || "all";
  const list =
    type === "all"
      ? categories
      : categories.filter((item) => item.appliesTo.includes(/** @type {'channel'|'group'|'bot'} */ (type)));

  return list.map((category) => {
    const count = communities.filter((c) => {
      if (c.categoryId !== category.id) return false;
      if (type !== "all" && c.type !== type) return false;
      return true;
    }).length;
    return { ...category, count };
  });
}

/**
 * @param {string} categoryId
 * @param {number} [limit]
 */
export function listByCategory(categoryId, limit = 20) {
  return searchCommunities({ category: categoryId, limit, sort: "members" });
}

/**
 * @param {number} [limit]
 */
export function listPopular(limit = 8) {
  return searchCommunities({ limit, sort: "members" });
}

/**
 * @param {import('./seed.js').Community} item
 */
function enrichCommunity(item) {
  const category = categories.find((c) => c.id === item.categoryId);
  return {
    ...item,
    categoryTitle: category?.title || item.categoryId,
    telegramUrl: `https://t.me/${item.username}`,
  };
}

export function getStats() {
  return {
    total: communities.length,
    channels: communities.filter((c) => c.type === "channel").length,
    groups: communities.filter((c) => c.type === "group").length,
    bots: communities.filter((c) => c.type === "bot").length,
    categories: categories.length,
  };
}
