"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { POPULAR_CHIPS } from "@/lib/brand";

const TABS = [
  { id: "all", label: "Hammasi", type: "all", ph: "Kanal, guruh yoki mavzu..." },
  { id: "channel", label: "Kanallar", type: "channel", ph: "Kanal nomi yoki mavzu..." },
  { id: "group", label: "Guruhlar", type: "group", ph: "Guruh nomi yoki mavzu..." },
] as const;

type SearchFormProps = {
  initialQuery?: string;
  initialType?: string;
  showTabs?: boolean;
  showChips?: boolean;
};

export function SearchForm({
  initialQuery = "",
  initialType = "all",
  showTabs = true,
  showChips = true,
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState(() => {
    const found = TABS.findIndex((item) => item.type === initialType);
    return found >= 0 ? found : 0;
  });

  function go(nextQuery: string, type: string) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (type !== "all") params.set("type", type);
    router.push(`/search${params.toString() ? `?${params}` : ""}`);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    go(query, TABS[tab].type);
  }

  return (
    <>
      <form className="ud-search" onSubmit={onSubmit} role="search">
        <label htmlFor="ud-q" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          Qidiruv
        </label>
        <div className="ud-search__field">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 L21 21" />
          </svg>
          <input
            id="ud-q"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={TABS[tab].ph}
            autoComplete="off"
          />
        </div>
        <button className="press shadow-md" type="submit">
          HIDLA
        </button>
      </form>

      {showTabs ? (
        <div className="ud-tabs" role="tablist" aria-label="Qidiruv turi">
          {TABS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === index}
              className={`ud-tab press ${tab === index ? "is-active" : ""}`}
              onClick={() => setTab(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {showChips ? (
        <div className="ud-chips">
          <span>Ko&apos;p hidlanganlar:</span>
          {POPULAR_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className="ud-chip"
              onClick={() => {
                setQuery(chip);
                go(chip, TABS[tab].type);
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
