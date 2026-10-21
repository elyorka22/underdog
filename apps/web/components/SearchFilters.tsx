"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
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
    <form className="filters" onSubmit={apply}>
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Запрос"
        aria-label="Запрос"
      />
      <select
        value={type}
        onChange={(event) => setType(event.target.value)}
        aria-label="Тип"
      >
        <option value="all">Все типы</option>
        <option value="channel">Каналы</option>
        <option value="group">Группы</option>
      </select>
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        aria-label="Категория"
      >
        <option value="all">Все категории</option>
        {categories.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(event) => setSort(event.target.value)}
        aria-label="Сортировка"
      >
        <option value="members">По размеру</option>
        <option value="title">По названию</option>
        <option value="newest">Новые в каталоге</option>
      </select>
      <button className="btn btn-primary" type="submit">
        Применить
      </button>
    </form>
  );
}
