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
    return { title: "Не найдено" };
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
    <section className="detail">
      <div className="shell">
        <div className="detail__panel">
          <p>
            <span className="pill">
              {item.type === "channel" ? "канал" : "группа"}
            </span>{" "}
            <span className="pill pill-muted">{item.categoryTitle}</span>
          </p>
          <h1 className="detail__title">{item.title}</h1>
          <p className="community-row__meta">
            @{item.username} · {formatMembers(item.membersCount)} участников
            {item.verified ? " · проверен" : ""}
          </p>
          <p className="community-row__desc" style={{ fontSize: "1.05rem" }}>
            {item.description}
          </p>
          <div className="tag-row">
            {item.tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
          <div className="detail__actions">
            <a
              className="btn btn-primary"
              href={item.telegramUrl}
              target="_blank"
              rel="noreferrer"
            >
              Открыть в Telegram
            </a>
            <Link
              className="btn btn-ghost"
              href={`/search?category=${item.categoryId}`}
            >
              Похожие в категории
            </Link>
            <Link className="btn btn-ghost" href="/search">
              Назад к поиску
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
