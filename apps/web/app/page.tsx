import Link from "next/link";
import { CommunityList } from "@/components/CommunityList";
import { SearchForm } from "@/components/SearchForm";
import { getCategories, getPopular, getStats } from "@/lib/api";

export default async function HomePage() {
  const [popular, categories, stats] = await Promise.all([
    getPopular(6),
    getCategories(),
    getStats(),
  ]);

  return (
    <>
      <section className="hero">
        <div className="hero__backdrop" aria-hidden />
        <div className="hero__grid" aria-hidden />
        <div className="hero__orb" aria-hidden />
        <div className="shell hero__content">
          <p className="hero__brand">
            Under<span>dog</span>
          </p>
          <h1 className="hero__title">Каналы и группы, которые стоит найти</h1>
          <p className="hero__lead">
            Поиск Telegram-сообществ по теме, типу и ключевым словам — без шума
            рекламных витрин.
          </p>
          <SearchForm />
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section__head">
            <div>
              <h2>Популярное сейчас</h2>
              <p>
                В каталоге {stats.total} сообществ · {stats.channels} каналов ·{" "}
                {stats.groups} групп
              </p>
            </div>
            <Link className="btn btn-ghost" href="/search">
              Весь каталог
            </Link>
          </div>
          <CommunityList items={popular.items} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="shell">
          <div className="section__head">
            <div>
              <h2>Категории</h2>
              <p>Выберите тему и перейдите к подборке</p>
            </div>
            <Link className="btn btn-ghost" href="/categories">
              Все категории
            </Link>
          </div>
          <div className="category-grid">
            {categories.items.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                className="category-link"
                href={`/search?category=${category.id}`}
              >
                <h3>{category.title}</h3>
                <p>
                  {category.description} · {category.count} в каталоге
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
