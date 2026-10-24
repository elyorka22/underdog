"use client";

import type { Community } from "@/lib/api";
import type { FavoriteItem } from "@/lib/favorites";
import { useFavorites } from "@/hooks/useFavorites";

type FavoriteButtonProps = {
  item: Community | FavoriteItem;
  compact?: boolean;
  className?: string;
};

export function FavoriteButton({
  item,
  compact = false,
  className = "",
}: FavoriteButtonProps) {
  const { has, toggle, ready } = useFavorites();
  const active = ready && has(item.username);

  return (
    <button
      type="button"
      className={`ud-fav ${compact ? "ud-fav--compact" : ""} ${active ? "is-active" : ""} ${className}`.trim()}
      aria-pressed={active}
      aria-label={active ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}
      title={active ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(item);
      }}
    >
      <span aria-hidden>{active ? "♥" : "♡"}</span>
      {compact ? null : (
        <span>{active ? "Sevimlida" : "Sevimlilarga"}</span>
      )}
    </button>
  );
}
