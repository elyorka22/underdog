import { Suspense } from "react";
import { CommunityList } from "@/components/CommunityList";
import { SearchFilters } from "@/components/SearchFilters";
import { getCategories, searchCommunities } from "@/lib/api";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    sort?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const [result, categories] = await Promise.all([
    searchCommunities({
      q: params.q,
      type: params.type,
      category: params.category,
      sort: params.sort,
      limit: 30,
    }),
    getCategories(),
  ]);

  return (
    <section className="section">
      <div className="shell">
        <div className="section__head">
          <div>
            <h2>Поиск</h2>
            <p>Фильтры по типу, категории и сортировке</p>
          </div>
        </div>

        <Suspense fallback={<div className="filters">Загрузка фильтров…</div>}>
          <SearchFilters categories={categories.items} />
        </Suspense>

        <p className="result-meta">
          Найдено: {result.total}
          {params.q ? ` по запросу «${params.q}»` : ""}
        </p>

        <CommunityList items={result.items} />
      </div>
    </section>
  );
}
