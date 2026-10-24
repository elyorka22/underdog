import { HomeDiscover } from "@/components/HomeDiscover";
import { getCategories, getPopular, getStats } from "@/lib/api";

export default async function HomePage() {
  const [categories, popular, stats] = await Promise.all([
    getCategories().catch(() => ({ items: [] })),
    getPopular(10).catch(() => ({ items: [], total: 0, limit: 10, offset: 0 })),
    getStats().catch(() => null),
  ]);

  return (
    <section className="tv-page">
      <HomeDiscover
        categories={categories.items}
        popular={popular.items}
        stats={stats}
      />
    </section>
  );
}
