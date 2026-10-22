import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMembers, getCommunity } from "@/lib/api";

type CommunityPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: CommunityPageProps) {
  const { id } = await params;
  try {
    const item = await getCommunity(id);
    return {
      title: item.title,
      description: item.description,
    };
  } catch {
    return { title: "Topilmadi" };
  }
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { id } = await params;
  let item;
  try {
    item = await getCommunity(id);
  } catch {
    notFound();
  }

  return (
    <section className="shell ud-page">
      <div className="ud-detail">
        <p style={{ margin: 0 }}>
          <span className="ud-badge">
            {item.type === "channel" ? "Kanal" : "Guruh"}
          </span>{" "}
          <span className="ud-badge">{item.categoryTitle}</span>
        </p>
        <h1>{item.title}</h1>
        <p style={{ margin: 0, fontWeight: 700 }}>
          @{item.username} · {formatMembers(item.membersCount)} obunachi
          {item.verified ? " · tekshirilgan" : ""}
        </p>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5, color: "var(--muted)" }}>
          {item.description}
        </p>
        <p style={{ margin: 0, fontWeight: 500 }}>
          {item.tags.map((tag) => `#${tag}`).join(" ")}
        </p>
        <div className="ud-detail__actions">
          <a
            className="press ud-btn ud-btn--pink shadow-sm"
            href={item.telegramUrl}
            target="_blank"
            rel="noreferrer"
          >
            Telegramda ochish
          </a>
          <Link
            className="press ud-btn ud-btn--white shadow-sm"
            href={`/search?category=${item.categoryId}`}
          >
            Shu kategoriyada
          </Link>
          <Link className="press ud-btn ud-btn--yellow shadow-sm" href="/search">
            Qidiruvga qaytish
          </Link>
        </div>
      </div>
    </section>
  );
}
