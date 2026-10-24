import { HomeDiscover } from "@/components/HomeDiscover";
import { getCategories } from "@/lib/api";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <section className="shell ud-home-page">
      <HomeDiscover categories={categories.items} />
    </section>
  );
}
