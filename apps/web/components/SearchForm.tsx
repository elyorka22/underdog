"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SearchFormProps = {
  initialQuery?: string;
  compact?: boolean;
};

export function SearchForm({
  initialQuery = "",
  compact = false,
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    const params = new URLSearchParams();
    if (value) params.set("q", value);
    router.push(`/search${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form className="search-bar" onSubmit={onSubmit} role="search">
      <input
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={
          compact
            ? "Например: дизайн, crypto, python"
            : "Найти канал или группу…"
        }
        aria-label="Поисковый запрос"
        autoComplete="off"
      />
      <button className="btn btn-primary" type="submit">
        Найти
      </button>
    </form>
  );
}
