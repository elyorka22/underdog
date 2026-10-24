"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category } from "@/lib/api";
import { CAT_ICONS, CAT_TAB_COLORS } from "@/lib/brand";
import { SearchForm } from "@/components/SearchForm";

type HomeDiscoverProps = {
  categories: Category[];
};

type Kind = "channel" | "group" | null;

export function HomeDiscover({ categories }: HomeDiscoverProps) {
  const [kind, setKind] = useState<Kind>(null);

  const kindLabel = useMemo(() => {
    if (kind === "channel") return "kanal";
    if (kind === "group") return "guruh";
    return "";
  }, [kind]);

  return (
    <div className="ud-discover">
      <SearchForm forcedType={kind || ""} showChips={!kind} />

      {!kind ? (
        <section className="ud-discover__step" aria-labelledby="pick-type">
          <div className="ud-section__head">
            <h2 id="pick-type">Avval nimani qidiramiz?</h2>
            <p>Birinchi qadam — kanal yoki guruhni tanlang.</p>
          </div>
          <div className="ud-type-grid">
            <button
              type="button"
              className="press ud-folder ud-folder--type"
              onClick={() => setKind("channel")}
            >
              <span
                className="ud-folder__tab"
                style={{ background: "#8FB7FF" }}
              />
              <span className="ud-folder__icon" aria-hidden>
                📣
              </span>
              <strong className="ud-folder__title">Kanallar</strong>
              <span className="ud-folder__meta">Yangilik, kontent, e’lonlar</span>
            </button>
            <button
              type="button"
              className="press ud-folder ud-folder--type"
              onClick={() => setKind("group")}
            >
              <span
                className="ud-folder__tab"
                style={{ background: "#6BE3B0" }}
              />
              <span className="ud-folder__icon" aria-hidden>
                👥
              </span>
              <strong className="ud-folder__title">Guruhlar</strong>
              <span className="ud-folder__meta">Suhbat, jamoa, muhokama</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="ud-discover__step" aria-labelledby="pick-cat">
          <div className="ud-section__head ud-section__head--row">
            <div>
              <h2 id="pick-cat">Endi kategoriyani tanlang</h2>
              <p>
                {kind === "channel" ? "Kanallar" : "Guruhlar"} uchun mavzuni
                tanlang.
              </p>
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
            {categories.map((category, index) => (
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
                    {category.count} ta {kindLabel}
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
