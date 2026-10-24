"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Category, CommunityType } from "@/lib/api";
import { getCategories } from "@/lib/api";
import { CAT_ICONS, CAT_TAB_COLORS } from "@/lib/brand";
import { SearchForm } from "@/components/SearchForm";

type HomeDiscoverProps = {
  categories: Category[];
};

type Kind = CommunityType | null;

const TYPE_META: Record<
  CommunityType,
  { title: string; meta: string; icon: string; tab: string; label: string }
> = {
  channel: {
    title: "Kanallar",
    meta: "Yangilik, kontent, e’lonlar",
    icon: "📣",
    tab: "#8FB7FF",
    label: "kanal",
  },
  group: {
    title: "Chatlar",
    meta: "Suhbat, tanishuv, jamoa",
    icon: "💬",
    tab: "#6BE3B0",
    label: "chat",
  },
  bot: {
    title: "Botlar",
    meta: "Vosita, AI, o‘yin botlari",
    icon: "🤖",
    tab: "#FFD60A",
    label: "bot",
  },
};

export function HomeDiscover({ categories }: HomeDiscoverProps) {
  const [kind, setKind] = useState<Kind>(null);
  const [visibleCategories, setVisibleCategories] = useState<Category[]>([]);
  const stepRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!kind) {
      setVisibleCategories([]);
      return;
    }

    let cancelled = false;
    const fallback = categories.filter((category) => {
      const applies = category.appliesTo || ["channel", "group"];
      return applies.includes(kind);
    });
    setVisibleCategories(fallback);

    getCategories(kind)
      .then((result) => {
        if (cancelled) return;
        if (result.items?.length) setVisibleCategories(result.items);
        else setVisibleCategories(fallback);
      })
      .catch(() => {
        if (!cancelled) setVisibleCategories(fallback);
      });

    return () => {
      cancelled = true;
    };
  }, [categories, kind]);

  useEffect(() => {
    if (!kind || !stepRef.current) return;
    stepRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [kind]);

  const kindMeta = kind ? TYPE_META[kind] : null;

  return (
    <div className="ud-discover">
      <SearchForm forcedType={kind || ""} showChips={!kind} />

      {!kind ? (
        <section className="ud-discover__step" aria-labelledby="pick-type">
          <div className="ud-section__head">
            <h2 id="pick-type">Avval nimani qidiramiz?</h2>
            <p>Birinchi qadam — kanal, chat yoki botni tanlang.</p>
          </div>
          <div className="ud-type-grid">
            {(Object.keys(TYPE_META) as CommunityType[]).map((id) => {
              const item = TYPE_META[id];
              return (
                <button
                  key={id}
                  type="button"
                  className="press ud-folder ud-folder--type"
                  onClick={() => setKind(id)}
                >
                  <span
                    className="ud-folder__tab"
                    style={{ background: item.tab }}
                  />
                  <span className="ud-folder__icon" aria-hidden>
                    {item.icon}
                  </span>
                  <strong className="ud-folder__title">{item.title}</strong>
                  <span className="ud-folder__meta">{item.meta}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section
          ref={stepRef}
          className="ud-discover__step"
          aria-labelledby="pick-cat"
        >
          <div className="ud-section__head ud-section__head--row">
            <div>
              <h2 id="pick-cat">Endi kategoriyani tanlang</h2>
              <p>{kindMeta?.title} uchun mos mavzular.</p>
            </div>
            <button
              type="button"
              className="press ud-btn ud-btn--white shadow-sm"
              onClick={() => setKind(null)}
            >
              ← Orqaga
            </button>
          </div>

          <div className="ud-folder-grid">
            {visibleCategories.map((category, index) => (
              <Link
                key={category.id}
                href={`/search?type=${kind}&category=${category.id}`}
                className="press ud-folder"
              >
                <span
                  className="ud-folder__tab"
                  style={{
                    background: CAT_TAB_COLORS[index % CAT_TAB_COLORS.length],
                  }}
                />
                <div className="ud-folder__top">
                  <span
                    className="ud-folder__icon-box"
                    style={{
                      background: CAT_TAB_COLORS[index % CAT_TAB_COLORS.length],
                    }}
                    aria-hidden
                  >
                    {CAT_ICONS[category.id] || "📁"}
                  </span>
                  <span className="ud-folder__meta">
                    {category.count} ta {kindMeta?.label}
                  </span>
                </div>
                <strong className="ud-folder__title">{category.title}</strong>
                <span className="ud-folder__desc">{category.description}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
