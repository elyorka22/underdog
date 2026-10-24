"use client";

import Link from "next/link";
import { useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import type { Community } from "@/lib/api";
import { formatMembers, typeLabel } from "@/lib/api";
import { RESULT_COLORS } from "@/lib/brand";
import { languageLabel, languageShort } from "@/lib/languages";

type CommunityListProps = {
  items: Community[];
  emptyText?: string;
};

export function CommunityList({
  items,
  emptyText = "Hech narsa topilmadi. Boshqa so‘rovni sinab ko‘ring.",
}: CommunityListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!items.length) {
    return <div className="ud-empty">{emptyText}</div>;
  }

  return (
    <div className="ud-results-list" role="list">
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        return (
          <article
            key={item.id}
            className={`ud-row${isOpen ? " is-open" : ""}`}
            role="listitem"
          >
            <div className="ud-row__line">
              <button
                type="button"
                className="ud-row__main"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                <span
                  className="ud-row__avatar"
                  style={{
                    background: RESULT_COLORS[index % RESULT_COLORS.length],
                  }}
                  aria-hidden
                >
                  {item.title.slice(0, 1).toUpperCase()}
                </span>
                <span className="ud-row__name">{item.title}</span>
                <span
                  className="ud-row__lang"
                  title={languageLabel(item.language)}
                >
                  {languageShort(item.language)}
                </span>
                <span className="ud-row__members" title="Obunachilar">
                  {formatMembers(item.membersCount)}
                </span>
                <span className="ud-row__chev" aria-hidden>
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>
              <FavoriteButton item={item} compact />
            </div>

            {isOpen ? (
              <div className="ud-row__details">
                <p className="ud-row__meta">
                  <span className="ud-badge">{typeLabel(item.type)}</span>
                  <span className="ud-badge">
                    {languageLabel(item.language)}
                  </span>
                  <span>@{item.username}</span>
                  {item.categoryTitle ? (
                    <span>{item.categoryTitle}</span>
                  ) : null}
                </p>
                {item.description ? (
                  <p className="ud-row__desc">{item.description}</p>
                ) : null}
                <div className="ud-row__actions">
                  <a
                    className="press ud-btn ud-btn--pink shadow-sm"
                    href={item.telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Telegramda ochish
                  </a>
                  <Link
                    className="press ud-btn ud-btn--white shadow-sm"
                    href={`/c/${item.username}`}
                  >
                    Batafsil
                  </Link>
                  <FavoriteButton item={item} />
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
