"use client";

import { useCallback, useEffect, useState } from "react";
import type { Community } from "@/lib/api";
import {
  FAVORITES_EVENT,
  type FavoriteItem,
  readFavorites,
  toggleFavorite,
} from "@/lib/favorites";

export function useFavorites() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setItems(readFavorites());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === "underdog_favorites_v1") {
        refresh();
      }
    };
    window.addEventListener(FAVORITES_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const has = useCallback(
    (idOrUsername: string) => {
      const key = String(idOrUsername).toLowerCase();
      return items.some(
        (item) =>
          item.id.toLowerCase() === key || item.username.toLowerCase() === key,
      );
    },
    [items],
  );

  const toggle = useCallback((item: Community | FavoriteItem) => {
    toggleFavorite(item);
    setItems(readFavorites());
  }, []);

  return { items, ready, has, toggle, count: items.length };
}
