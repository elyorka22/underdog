import Link from "next/link";
import type { Community } from "@/lib/api";
import { formatMembers } from "@/lib/api";
import { RESULT_COLORS } from "@/lib/brand";

type CommunityListProps = {
  items: Community[];
  emptyText?: string;
};

export function CommunityList({
  items,
  emptyText = "Hech narsa topilmadi. Boshqa so'rovni sinab ko'ring.",
}: CommunityListProps) {
  if (!items.length) {
    return <div className="ud-empty">{emptyText}</div>;
  }

  return (
    <div className="ud-results-list">
      {items.map((item, index) => (
        <article key={item.id} className="ud-result">
          <div
            className="ud-result__avatar"
            style={{ background: RESULT_COLORS[index % RESULT_COLORS.length] }}
          >
            {item.title.slice(0, 1).toUpperCase()}
          </div>
          <div className="ud-result__body">
            <Link href={`/c/${item.username}`} className="ud-result__title">
              {item.title}
            </Link>
            <p className="ud-result__desc">{item.description}</p>
            <p className="ud-result__meta">
              <span className="ud-badge">
                {item.type === "channel" ? "Kanal" : "Guruh"}
              </span>
              &nbsp; @{item.username} · {formatMembers(item.membersCount)}{" "}
              obunachi
            </p>
          </div>
          <a
            className="press ud-result__open shadow-sm"
            href={item.telegramUrl}
            target="_blank"
            rel="noreferrer"
          >
            Ochish
          </a>
        </article>
      ))}
    </div>
  );
}
