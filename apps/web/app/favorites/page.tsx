"use client";

import Link from "next/link";
import { CommunityList } from "@/components/CommunityList";
import { useFavorites } from "@/hooks/useFavorites";
import type { Community } from "@/lib/api";

export default function FavoritesPage() {
  const { items, ready, count } = useFavorites();

  const communities: Community[] = items.map((item) => ({
    id: item.id,
    username: item.username,
    title: item.title,
    description: "",
    type: item.type,
    categoryId: "",
    categoryTitle: item.categoryTitle,
    language: item.language,
    membersCount: item.membersCount,
    tags: [],
    verified: false,
    telegramUrl: item.telegramUrl,
  }));

  return (
    <section className="shell ud-page ud-page--search">
      <div className="ud-stamp ud-stamp--pink">SEVIMLILAR</div>
      <h2 className="ud-search-title">Sevimlilar</h2>
      <p className="ud-search-lead">
        Saqlangan kanal va guruhlar shu qurilmada saqlanadi. Ro‘yxatdan nomni
        bosing — Telegram havolasi ochiladi.
      </p>

      {!ready ? (
        <p className="ud-search-lead">Yuklanmoqda…</p>
      ) : (
        <>
          <p className="ud-search-count">Jami: {count}</p>
          <CommunityList
            items={communities}
            emptyText="Hali sevimlilar yo‘q. Qidiruvda ♡ tugmasini bosing."
          />
          {!count ? (
            <div className="ud-detail__actions" style={{ marginTop: 8 }}>
              <Link className="press ud-btn ud-btn--yellow shadow-sm" href="/search">
                Qidirishga o‘tish
              </Link>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
