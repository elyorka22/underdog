import type { Community, CommunityType } from "@/lib/api";

export const FAVORITES_KEY = "underdog_favorites_v1";
export const FAVORITES_EVENT = "underdog:favorites";

export type FavoriteItem = {
  id: string;
  username: string;
  title: string;
  type: CommunityType;
  language: string;
  membersCount: number;
  categoryTitle: string;
  telegramUrl: string;
  savedAt: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readFavorites(): FavoriteItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavorites(items: FavoriteItem[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
}

export function isFavorite(idOrUsername: string) {
  const key = String(idOrUsername).toLowerCase();
  return readFavorites().some(
    (item) =>
      item.id.toLowerCase() === key || item.username.toLowerCase() === key,
  );
}

export function communityToFavorite(item: Community): FavoriteItem {
  return {
    id: item.id,
    username: item.username,
    title: item.title,
    type: item.type,
    language: item.language || "uz",
    membersCount: item.membersCount,
    categoryTitle: item.categoryTitle || "",
    telegramUrl: item.telegramUrl,
    savedAt: new Date().toISOString(),
  };
}

export function toggleFavorite(item: Community | FavoriteItem) {
  const current = readFavorites();
  const key = item.username.toLowerCase();
  const exists = current.some((row) => row.username.toLowerCase() === key);
  const next = exists
    ? current.filter((row) => row.username.toLowerCase() !== key)
    : [
        "savedAt" in item && item.savedAt
          ? (item as FavoriteItem)
          : communityToFavorite(item as Community),
        ...current,
      ];
  writeFavorites(next);
  return !exists;
}

export function removeFavorite(username: string) {
  const key = username.toLowerCase();
  writeFavorites(
    readFavorites().filter((item) => item.username.toLowerCase() !== key),
  );
}
