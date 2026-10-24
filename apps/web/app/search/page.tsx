import { Suspense } from "react";
import { CommunityList } from "@/components/CommunityList";
import { SearchFilters } from "@/components/SearchFilters";
import { getCategories, searchCommunities } from "@/lib/api";
import { languageLabel } from "@/lib/languages";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    language?: string;
    sort?: string;
  }>;
};

export const metadata = {
  title: "Natijalar",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const [result, categories] = await Promise.all([
    searchCommunities({
      q: params.q,
      type: params.type,
      category: params.category,
      language: params.language,
      sort: params.sort,
      limit: 30,
    }),
    getCategories(),
  ]);

  const typeLabel =
    params.type === "channel"
      ? "Kanallar"
      : params.type === "group"
        ? "Chatlar"
        : params.type === "bot"
          ? "Botlar"
          : "Barcha turlar";
  const langLabel =
    params.language && params.language !== "all"
      ? languageLabel(params.language)
      : "Barcha tillar";

  return (
    <section className="shell ud-page ud-page--search">
      <div className="ud-stamp ud-stamp--yellow">QIDIRUV</div>
      <h2 className="ud-search-title">Natijalar</h2>
      <p className="ud-search-lead">
        Ro‘yxatdan nomni bosing — batafsil ma’lumot va Telegram havolasi ochiladi.
      </p>

      <Suspense fallback={<div className="ud-filters">Yuklanmoqda…</div>}>
        <SearchFilters categories={categories.items} />
      </Suspense>

      <p className="ud-search-count">
        Topildi: {result.total} · {typeLabel} · {langLabel}
        {params.q ? ` — «${params.q}»` : ""}
      </p>

      <CommunityList items={result.items} />
    </section>
  );
}
