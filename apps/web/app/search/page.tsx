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
      sort: params.sort,
      limit: 30,
    }),
    getCategories(),
  ]);

  const typeLabel =
    params.type === "channel"
      ? "Kanallar"
      : params.type === "group"
        ? "Guruhlar"
        : "Barcha turlar";

  return (
    <section className="shell ud-page">
      <div className="ud-stamp ud-stamp--yellow">QIDIRUV</div>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px, 5vw, 56px)",
          lineHeight: 1.05,
        }}
      >
        Natijalar
      </h2>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 18 }}>
        Avval kanal yoki guruhni tanlang, keyin kategoriyani belgilang.
      </p>

      <Suspense fallback={<div className="ud-filters">Yuklanmoqda…</div>}>
        <SearchFilters categories={categories.items} />
      </Suspense>

      <p style={{ margin: 0, fontWeight: 700 }}>
        Topildi: {result.total} · {typeLabel}
        {params.q ? ` — «${params.q}»` : ""}
      </p>

      <CommunityList items={result.items} />
    </section>
  );
}
