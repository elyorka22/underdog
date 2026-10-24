"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, CommunityType } from "@/lib/api";
import { getCategories } from "@/lib/api";
import { BOT_URL, CAT_ICONS, CAT_TAB_COLORS } from "@/lib/brand";

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
    meta: "Yangilik va e’lonlar",
    icon: "📣",
    tab: "#8FB7FF",
    label: "kanal",
  },
  group: {
    title: "Chatlar",
    meta: "Suhbat va jamoalar",
    icon: "💬",
    tab: "#6BE3B0",
    label: "chat",
  },
  bot: {
    title: "Botlar",
    meta: "AI va foydali vositalar",
    icon: "🤖",
    tab: "#FFD60A",
    label: "bot",
  },
};

export function HomeDiscover({ categories }: HomeDiscoverProps) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>(null);
  const [query, setQuery] = useState("");
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

  function goSearch(nextQuery = query) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (kind) params.set("type", kind);
    router.push(`/search${params.toString() ? `?${params}` : ""}`);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    goSearch();
  }

  const kindMeta = kind ? TYPE_META[kind] : null;
  const placeholder = kind
    ? `${kindMeta?.title} ichidan qidirish…`
    : "Kanal, chat yoki bot nomi…";

  return (
    <div className="ud-home">
      <header className="ud-home__bar">
        <Link
          href="/favorites"
          className="press ud-home__icon-btn"
          aria-label="Sevimlilar"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="ud-home__bar-right">
          <Link
            href="/categories"
            className="press ud-home__icon-btn"
            aria-label="Kategoriyalar"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 8h16v11H4V8Z"
                stroke="currentColor"
                strokeWidth="2.4"
              />
              <path d="M8 8V6h8v2" stroke="currentColor" strokeWidth="2.4" />
              <path d="M12 8v11" stroke="currentColor" strokeWidth="2.4" />
            </svg>
          </Link>
          <Link
            href="/search"
            className="press ud-home__icon-btn"
            aria-label="Qidiruv"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="2.4" />
              <path d="M15.5 15.5 20 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="ud-home__hero">
        <p className="ud-home__brand">UnderDog</p>
        <h1 className="ud-home__title">
          Hozir qidiring.
          <br />
          Istalgan paytda toping.
        </h1>
      </div>

      <form className="ud-home__search" onSubmit={onSubmit} role="search">
        <label className="sr-only" htmlFor="ud-home-q">
          Qidirish
        </label>
        <div className="ud-home__search-field">
          <span className="ud-home__hash" aria-hidden>
            #
          </span>
          <input
            id="ud-home-q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            autoComplete="off"
          />
        </div>
        <button
          className="press ud-home__add"
          type="submit"
          aria-label="Qidirish"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </form>

      {!kind ? (
        <section className="ud-home__section" aria-labelledby="home-types">
          <h2 id="home-types" className="ud-home__section-title">
            Nimani qidiramiz?
          </h2>
          <div className="ud-home__folders">
            {(Object.keys(TYPE_META) as CommunityType[]).map((id) => {
              const item = TYPE_META[id];
              return (
                <button
                  key={id}
                  type="button"
                  className="press ud-home-folder"
                  onClick={() => setKind(id)}
                >
                  <span
                    className="ud-home-folder__tab"
                    style={{ background: item.tab }}
                  />
                  <div className="ud-home-folder__top">
                    <span
                      className="ud-home-folder__icon"
                      style={{ background: item.tab }}
                      aria-hidden
                    >
                      {item.icon}
                    </span>
                    <span className="ud-home-folder__count">{item.meta}</span>
                  </div>
                  <strong className="ud-home-folder__title">{item.title}</strong>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section
          ref={stepRef}
          className="ud-home__section"
          aria-labelledby="home-cats"
        >
          <div className="ud-home__section-head">
            <h2 id="home-cats" className="ud-home__section-title">
              {kindMeta?.title}
            </h2>
            <button
              type="button"
              className="press ud-home__back"
              onClick={() => setKind(null)}
            >
              ← Orqaga
            </button>
          </div>
          <div className="ud-home__folders ud-home__folders--cats">
            {visibleCategories.map((category, index) => {
              const tab = CAT_TAB_COLORS[index % CAT_TAB_COLORS.length];
              return (
                <Link
                  key={category.id}
                  href={`/search?type=${kind}&category=${category.id}`}
                  className="press ud-home-folder"
                >
                  <span
                    className="ud-home-folder__tab"
                    style={{ background: tab }}
                  />
                  <div className="ud-home-folder__top">
                    <span
                      className="ud-home-folder__icon"
                      style={{ background: tab }}
                      aria-hidden
                    >
                      {CAT_ICONS[category.id] || "📁"}
                    </span>
                    <span className="ud-home-folder__count">
                      {category.count} {kindMeta?.label}
                    </span>
                  </div>
                  <strong className="ud-home-folder__title">
                    {category.title}
                  </strong>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <a
        className="press ud-home__bot"
        href={BOT_URL}
        target="_blank"
        rel="noreferrer"
      >
        Telegram botda ochish
      </a>
    </div>
  );
}
