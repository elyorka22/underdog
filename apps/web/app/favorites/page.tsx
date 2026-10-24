"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DogMark } from "@/components/DogMark";
import { useFavorites } from "@/hooks/useFavorites";
import { formatMembers, typeLabel } from "@/lib/api";
import { BOT_URL, CAT_COLORS, RESULT_COLORS } from "@/lib/brand";
import type { FavoriteItem } from "@/lib/favorites";

export default function FavoritesPage() {
  const { items, ready, count, toggle } = useFavorites();
  const [filter, setFilter] = useState<string | null>(null);

  const folders = useMemo(() => {
    const cats = new Map<string, number>();
    for (const item of items) {
      const key = item.categoryTitle || "Boshqa";
      cats.set(key, (cats.get(key) || 0) + 1);
    }
    const list = Array.from(cats.entries()).map(([label, n], index) => ({
      label,
      count: n,
      color: CAT_COLORS[index % CAT_COLORS.length],
      value: label,
    }));
    return [
      {
        label: "Hammasi",
        count: items.length,
        color: "#FFD60A",
        value: null as string | null,
      },
      ...list,
    ];
  }, [items]);

  const rows = useMemo(() => {
    if (!filter) return items;
    return items.filter(
      (item) => (item.categoryTitle || "Boshqa") === filter,
    );
  }, [items, filter]);

  function initialOf(item: FavoriteItem) {
    const raw = (item.username || item.title || "?").replace(/^@/, "");
    return raw.charAt(0).toUpperCase() || "?";
  }

  function colorOf(item: FavoriteItem, index: number) {
    if (item.type === "channel") return "#FFD60A";
    if (item.type === "group") return "#6BE3B0";
    if (item.type === "bot") return "#8FB7FF";
    return RESULT_COLORS[index % RESULT_COLORS.length];
  }

  const botHandle = BOT_URL.replace(/^https?:\/\/t\.me\//i, "@");

  return (
    <div className="tv-saved">
      <header className="tv-top">
        <div className="tv-top__left">
          <Link className="tv-icon-btn press" href="/" aria-label="Orqaga">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 5 L8 12 L15 19" />
            </svg>
          </Link>
          <h1 className="tv-saved__title">Saqlanganlar</h1>
        </div>
        <div className="tv-top__actions">
          <a
            className="tv-bot-pill ud-hide-sm press"
            href={BOT_URL}
            target="_blank"
            rel="noreferrer"
          >
            {botHandle}
          </a>
          <Link className="tv-icon-btn press" href="/search" aria-label="Qidirish">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="2.8" strokeLinecap="round" aria-hidden>
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.5 15.5 L21 21" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="tv-saved__body">
        {!ready ? (
          <p className="tv-saved__loading">Yuklanmoqda…</p>
        ) : (
          <>
            <div className="tv-folder-grid tv-folder-grid--saved">
              {folders.map((folder) => {
                const active =
                  folder.value === null ? filter === null : filter === folder.value;
                return (
                  <button
                    key={folder.label}
                    type="button"
                    className="tv-folder tv-folder--saved press"
                    onClick={() => setFilter(folder.value)}
                  >
                    <span
                      className="tv-folder__tab"
                      style={{ background: folder.color }}
                      aria-hidden
                    />
                    <span
                      className="tv-folder__body"
                      style={{ background: active ? "#FFF1A8" : "#FFFDF8" }}
                    >
                      <span className="tv-mono">{folder.count} ta</span>
                      <span className="tv-folder__label">{folder.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="tv-mail">
              <div className="tv-mail__inner">
                <div className="tv-mail__head">
                  <span className="tv-mail__stamp">SAQLANGAN</span>
                  <span className="tv-mono">{rows.length} ta</span>
                </div>

                {rows.map((item, index) => (
                  <div className="tv-mail__row" key={item.username}>
                    <div className="tv-mail__main">
                      <span
                        className="tv-mail__avatar"
                        style={{ background: colorOf(item, index) }}
                      >
                        {initialOf(item)}
                      </span>
                      <span className="tv-mail__text">
                        <span className="tv-mail__handle">
                          @{item.username.replace(/^@/, "")}
                        </span>
                        <span className="tv-mono tv-mail__sub">
                          {typeLabel(item.type)}
                          {item.categoryTitle ? ` · ${item.categoryTitle}` : ""}
                          {item.membersCount
                            ? ` · ${formatMembers(item.membersCount)}`
                            : ""}
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="tv-mail__action"
                      aria-label="Saqlanganlardan olib tashlash"
                      onClick={() => toggle(item)}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#FF4F8B" stroke="#14121F" strokeWidth="2.4" strokeLinejoin="round" aria-hidden>
                        <path d="M6 3 H18 V21 L12 16.5 L6 21 Z" />
                      </svg>
                    </button>
                    <a
                      className="tv-mail__action"
                      href={item.telegramUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Telegramda ochish"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M7 17 L17 7 M9 7 H17 V15" />
                      </svg>
                    </a>
                  </div>
                ))}

                {!count ? (
                  <div className="tv-mail__empty">
                    <span>Hozircha hech narsa saqlanmagan.</span>
                    <Link className="tv-cta__btn press" href="/search">
                      Qidirishga o‘tish
                    </Link>
                  </div>
                ) : null}

                {count && !rows.length ? (
                  <div className="tv-mail__empty">
                    <span>Bu papkada saqlanganlar yo‘q.</span>
                    <button
                      type="button"
                      className="tv-cta__btn press"
                      onClick={() => setFilter(null)}
                    >
                      Hammasi
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="tv-footer">
        <div className="tv-footer__brand">
          <span className="tv-footer__mark">
            <DogMark size={22} />
            UnderDog
          </span>
          <p>
            UnderDog Telegram bilan rasmiy bog‘liq emas. Faqat ochiq kanal va
            guruhlar qidiriladi.
          </p>
        </div>
        <div className="tv-footer__links">
          <Link href="/">Bosh sahifa</Link>
          <Link href="/favorites">Saqlanganlar</Link>
          <a href={BOT_URL} target="_blank" rel="noreferrer">
            {botHandle}
          </a>
        </div>
      </footer>
    </div>
  );
}
