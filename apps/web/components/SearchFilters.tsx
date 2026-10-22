"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/api";

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
      sort: searchParams.get("sort") || "members",
    }),
    [searchParams],
  );

  const [q, setQ] = useState(initial.q);
  const [type, setType] = useState(initial.type);
  const [category, setCategory] = useState(initial.category);
  const [sort, setSort] = useState(initial.sort);

  function apply(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (type !== "all") params.set("type", type);
    if (category !== "all") params.set("category", category);
    if (sort !== "members") params.set("sort", sort);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form className="ud-filters" onSubmit={apply}>
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="So'rov"
        aria-label="So'rov"
      />
      <select
        value={type}
        onChange={(event) => setType(event.target.value)}
        aria-label="Tur"
      >
        <option value="all">Barcha turlar</option>
        <option value="channel">Kanallar</option>
        <option value="group">Guruhlar</option>
      </select>
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        aria-label="Kategoriya"
      >
        <option value="all">Barcha kategoriyalar</option>
        {categories.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(event) => setSort(event.target.value)}
        aria-label="Saralash"
      >
        <option value="members">Obunachilar bo'yicha</option>
        <option value="title">Nom bo'yicha</option>
        <option value="newest">Yangi</option>
      </select>
      <button className="press" type="submit">
        Qo&apos;llash
      </button>
    </form>
  );
}
