import Link from "next/link";
import { getCategories } from "@/lib/api";
import { CAT_ICONS, CAT_TAB_COLORS } from "@/lib/brand";

export const metadata = {
  title: "Kategoriyalar",
};

export default async function CategoriesPage() {
  const { items } = await getCategories();

  return (
    <section className="shell ud-page">
      <div className="ud-stamp ud-stamp--pink">KATEGORIYALAR</div>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px, 5vw, 56px)",
          lineHeight: 1.05,
        }}
      >
        Mavzuni tanlang
      </h2>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 18, maxWidth: 520 }}>
        Avval kanal yoki guruhni tanlang — keyin shu kategoriya bo‘yicha natijalar
        ochiladi.
      </p>

      <div className="ud-type-grid" style={{ marginTop: 8 }}>
        <Link href="/search?type=channel" className="press ud-folder ud-folder--type">
          <span className="ud-folder__tab" style={{ background: "#8FB7FF" }} />
          <span className="ud-folder__icon" aria-hidden>
            📣
          </span>
          <strong className="ud-folder__title">Kanallar</strong>
          <span className="ud-folder__meta">Kanal bo‘yicha qidirish</span>
        </Link>
        <Link href="/search?type=group" className="press ud-folder ud-folder--type">
          <span className="ud-folder__tab" style={{ background: "#6BE3B0" }} />
          <span className="ud-folder__icon" aria-hidden>
            👥
          </span>
          <strong className="ud-folder__title">Guruhlar</strong>
          <span className="ud-folder__meta">Guruh bo‘yicha qidirish</span>
        </Link>
      </div>

      <h3 style={{ margin: "28px 0 0", fontSize: 22 }}>Yoki kategoriya</h3>
      <div className="ud-folder-grid">
        {items.map((category, index) => (
          <Link
            key={category.id}
            href={`/search?category=${category.id}`}
            className="press ud-folder"
          >
            <span
              className="ud-folder__tab"
              style={{
                background: CAT_TAB_COLORS[index % CAT_TAB_COLORS.length],
              }}
            />
            <div className="ud-folder__top">
              <span
                className="ud-folder__icon-box"
                style={{
                  background: CAT_TAB_COLORS[index % CAT_TAB_COLORS.length],
                }}
                aria-hidden
              >
                {CAT_ICONS[category.id] || "📁"}
              </span>
              <span className="ud-folder__meta">{category.count} ta</span>
            </div>
            <strong className="ud-folder__title">{category.title}</strong>
            <span className="ud-folder__desc">{category.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
