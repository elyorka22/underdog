"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/api";
import { LANGUAGES } from "@/lib/languages";

type SearchFiltersProps = {
  categories: Category[];
};

export function SearchFilters({ categories }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial = useMemo(
    () => ({
      q: searchParams.get("q") || "",
      type: searchParams.get("type") || "all",
      category: searchParams.get("category") || "all",
      language: searchParams.get("language") || "all",
      sort: searchParams.get("sort") || "members",
    }),
    [searchParams],
  );

  const [q, setQ] = useState(initial.q);
  const [type, setType] = useState(initial.type);
  const [category, setCategory] = useState(initial.category);
  const [language, setLanguage] = useState(initial.language);
  const [sort, setSort] = useState(initial.sort);

  function push(next: {
    q?: string;
    type?: string;
    category?: string;
    language?: string;
    sort?: string;
  }) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextType = next.type ?? type;
    const nextCategory = next.category ?? category;
    const nextLanguage = next.language ?? language;
    const nextSort = next.sort ?? sort;
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextType !== "all") params.set("type", nextType);
    if (nextCategory !== "all") params.set("category", nextCategory);
    if (nextLanguage !== "all") params.set("language", nextLanguage);
    if (nextSort !== "members") params.set("sort", nextSort);
    router.push(`/search?${params.toString()}`);
  }

  function apply(event: FormEvent) {
    event.preventDefault();
    push({});
  }

  return (
    <form className="ud-filters" onSubmit={apply}>
      <div className="ud-type-pills" role="group" aria-label="Tur">
        {(
          [
            { id: "all", label: "Hammasi" },
            { id: "channel", label: "Kanallar" },
            { id: "group", label: "Guruhlar" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            className={`press ud-tab ${type === item.id ? "is-active" : ""}`}
            onClick={() => {
              setType(item.id);
              setCategory("all");
              push({ type: item.id, category: "all" });
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="ud-type-pills" role="group" aria-label="Til">
        <button
          type="button"
          className={`press ud-tab ${language === "all" ? "is-active" : ""}`}
          onClick={() => {
            setLanguage("all");
            push({ language: "all" });
          }}
        >
          Barcha tillar
        </button>
        {LANGUAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`press ud-tab ${language === item.id ? "is-active" : ""}`}
            onClick={() => {
              setLanguage(item.id);
              push({ language: item.id });
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Qidiruv so‘zi"
        aria-label="Qidiruv so‘zi"
      />

      <select
        value={category}
        onChange={(event) => {
          const value = event.target.value;
          setCategory(value);
          push({ category: value });
        }}
        aria-label="Kategoriya"
        disabled={type === "all"}
        title={
          type === "all"
            ? "Avval kanal yoki guruhni tanlang"
            : "Kategoriyani tanlang"
        }
      >
        <option value="all">
          {type === "all"
            ? "Avval turini tanlang"
            : "Barcha kategoriyalar"}
        </option>
        {categories.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(event) => {
          const value = event.target.value;
          setSort(value);
          push({ sort: value });
        }}
        aria-label="Saralash"
      >
        <option value="members">Obunachilar bo‘yicha</option>
        <option value="title">Nom bo‘yicha</option>
        <option value="newest">Yangilari</option>
      </select>

      <button className="press" type="submit">
        Qidirish
      </button>
    </form>
  );
}
