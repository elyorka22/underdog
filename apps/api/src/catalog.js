import * as memory from "@underdog/shared";
import {
  getCommunity as dbGetCommunity,
  getStats as dbGetStats,
  hasDatabase,
  listByCategory as dbListByCategory,
  listCategories as dbListCategories,
  listPopular as dbListPopular,
  searchCommunities as dbSearchCommunities,
} from "@underdog/db";

export function usingDatabase() {
  return hasDatabase();
}

export async function searchCommunities(params) {
  if (hasDatabase()) return dbSearchCommunities(params);
  return memory.searchCommunities(params);
}

export async function getCommunity(idOrUsername) {
  if (hasDatabase()) return dbGetCommunity(idOrUsername);
  return memory.getCommunity(idOrUsername);
}

/**
 * @param {{ type?: string }} [filters]
 */
export async function listCategories(filters = {}) {
  if (hasDatabase()) return dbListCategories(filters);
  return memory.listCategories(filters);
}

export async function listByCategory(categoryId, limit) {
  if (hasDatabase()) return dbListByCategory(categoryId, limit);
  return memory.listByCategory(categoryId, limit);
}

export async function listPopular(limit) {
  if (hasDatabase()) return dbListPopular(limit);
  return memory.listPopular(limit);
}

export async function getStats() {
  if (hasDatabase()) return dbGetStats();
  return memory.getStats();
}
