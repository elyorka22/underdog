import Link from "next/link";
import { PawIcon } from "@/components/DogMark";
import { getCategories } from "@/lib/api";
import { CAT_COLORS, CAT_ROTATIONS } from "@/lib/brand";

export const metadata = {
  title: "Kategoriyalar",
};

export default async function CategoriesPage() {
  const { items } = await getCategories();

  return (
    <section className="shell ud-page">
      <div className="ud-stamp ud-stamp--pink">KATEGORIYALAR</div>
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 1.05 }}>
        Qaysi hid bilan izlaymiz?
      </h2>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 18, maxWidth: 520 }}>
        Mavzuni tanla — UnderDog tegishli kanal va guruhlarni olib keladi.
      </p>
      <div className="ud-cat-grid">
        {items.map((category, index) => (
          <Link
            key={category.id}
            href={`/search?category=${category.id}`}
            className="press ud-cat shadow-md"
            style={{
              background: CAT_COLORS[index % CAT_COLORS.length],
              transform: `rotate(${CAT_ROTATIONS[index % CAT_ROTATIONS.length]})`,
            }}
          >
            <PawIcon />
            <div>
              <div className="ud-cat__name">{category.title}</div>
              <div className="ud-cat__note">
                {category.description}
                <br />
                {category.count} ta
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
