import Link from "next/link";
import { getCategories } from "@/lib/api";

export const metadata = {
  title: "Категории",
};

export default async function CategoriesPage() {
  const { items } = await getCategories();

  return (
    <section className="section">
      <div className="shell">
        <div className="section__head">
          <div>
            <h2>Категории</h2>
            <p>Тематические подборки каналов и групп</p>
          </div>
        </div>
        <div className="category-grid">
          {items.map((category) => (
            <Link
              key={category.id}
              className="category-link"
              href={`/search?category=${category.id}`}
            >
              <h3>{category.title}</h3>
              <p>
                {category.description}
                <br />
                {category.count} сообществ
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
