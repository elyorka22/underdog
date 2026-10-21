import Link from "next/link";
import type { Community } from "@/lib/api";
import { formatMembers } from "@/lib/api";

type CommunityListProps = {
  items: Community[];
  emptyText?: string;
};

export function CommunityList({
  items,
  emptyText = "Ничего не найдено. Попробуйте другой запрос.",
}: CommunityListProps) {
  if (!items.length) {
    return <div className="empty">{emptyText}</div>;
  }

  return (
    <div className="list">
      {items.map((item) => (
        <article key={item.id} className="community-row">
          <div>
            <h3 className="community-row__title">
              <Link href={`/c/${item.username}`}>{item.title}</Link>
            </h3>
            <p className="community-row__meta">
              <span className="pill">
                {item.type === "channel" ? "канал" : "группа"}
              </span>{" "}
              <span className="pill pill-muted">{item.categoryTitle}</span>{" "}
              @{item.username} · {formatMembers(item.membersCount)} уч.
              {item.verified ? " · проверен" : ""}
            </p>
            <p className="community-row__desc">{item.description}</p>
            <div className="tag-row">
              {item.tags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div>
            <a
              className="btn btn-dark"
              href={item.telegramUrl}
              target="_blank"
              rel="noreferrer"
            >
              Открыть
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
