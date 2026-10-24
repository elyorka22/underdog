"use client";

import { FavoriteButton } from "@/components/FavoriteButton";
import type { Community } from "@/lib/api";

export function FavoriteActions({ item }: { item: Community }) {
  return <FavoriteButton item={item} />;
}
