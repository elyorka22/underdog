"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { POPULAR_CHIPS } from "@/lib/brand";

type SearchFormProps = {
  initialQuery?: string;
  /** Forced community type from the guided flow */
  forcedType?: "channel" | "group" | "bot" | "";
  showChips?: boolean;
};

export function SearchForm({
  initialQuery = "",
  forcedType = "",
  showChips = true,
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function go(nextQuery: string) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (forcedType) params.set("type", forcedType);
    router.push(`/search${params.toString() ? `?${params}` : ""}`);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    go(query);
  }

  const placeholder =
    forcedType === "channel"
      ? "Kanal nomi yoki mavzu…"
      : forcedType === "group"
        ? "Chat nomi yoki mavzu…"
        : forcedType === "bot"
          ? "Bot nomi yoki mavzu…"
          : "Nima qidiryapsiz?";

  return (
    <>
      <form className="ud-search" onSubmit={onSubmit} role="search">
        <label
          htmlFor="ud-q"
          className="sr-only"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
          }}
        >
          Qidirish
        </label>
        <div className="ud-search__field">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#14121F"
            strokeWidth="2.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 L21 21" />
          </svg>
          <input
            id="ud-q"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            autoComplete="off"
          />
        </div>
        <button className="press shadow-md ud-search__go" type="submit">
          Qidirish
        </button>
      </form>

      {showChips ? (
        <div className="ud-chips">
          <span>Mashhur:</span>
          {POPULAR_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className="ud-chip"
              onClick={() => {
                setQuery(chip);
                go(chip);
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
