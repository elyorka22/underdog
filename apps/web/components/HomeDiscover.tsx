"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { DogHero, DogMark } from "@/components/DogMark";
import { useFavorites } from "@/hooks/useFavorites";
import {
  formatMembers,
  getApiBase,
  type Category,
  type Community,
  type Stats,
  typeLabel,
} from "@/lib/api";
import { BOT_URL, CAT_COLORS, CAT_ICONS } from "@/lib/brand";

type HomeDiscoverProps = {
  categories: Category[];
  popular: Community[];
  stats: Stats | null;
};

const TYPE_FOLDERS = [
  {
    id: "channel" as const,
    title: "Kanallar",
    href: "/search?type=channel",
    color: "#FFD60A",
    icon: "channel",
  },
  {
    id: "group" as const,
    title: "Chatlar",
    href: "/search?type=group",
    color: "#6BE3B0",
    icon: "group",
  },
  {
    id: "bot" as const,
    title: "Botlar",
    href: "/search?type=bot",
    color: "#8FB7FF",
    icon: "bot",
  },
  {
    id: "saved" as const,
    title: "Saqlanganlar",
    href: "/favorites",
    color: "#FF4F8B",
    icon: "saved",
  },
];

function TypeIcon({ kind }: { kind: string }) {
  if (kind === "channel") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
        <path d="M4 10 V14 H8 L15 18 V6 L8 10 Z" />
        <path d="M18 9 Q20 12 18 15" />
      </svg>
    );
  }
  if (kind === "group") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
        <circle cx="9" cy="9" r="3.2" />
        <path d="M3 19 C3 15 6 14 9 14 C12 14 15 15 15 19" />
        <circle cx="17" cy="8" r="2.4" />
        <path d="M17 13 C19.5 13 21 14.5 21 17" />
      </svg>
    );
  }
  if (kind === "bot") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
        <rect x="5" y="8" width="14" height="11" rx="3" />
        <path d="M12 8 V4 M9.5 13 H9.6 M14.5 13 H14.6" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="2.4" strokeLinejoin="round" aria-hidden>
      <path d="M6 3 H18 V21 L12 16.5 L6 21 Z" />
    </svg>
  );
}

function PawIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <ellipse cx="24" cy="31" rx="11" ry="9" fill="#14121F" />
      <ellipse cx="9" cy="21" rx="5" ry="6.5" fill="#14121F" />
      <ellipse cx="19" cy="11" rx="5" ry="6.5" fill="#14121F" />
      <ellipse cx="31" cy="11" rx="5" ry="6.5" fill="#14121F" />
      <ellipse cx="40" cy="21" rx="5" ry="6.5" fill="#14121F" />
    </svg>
  );
}

export function HomeDiscover({ categories, popular, stats }: HomeDiscoverProps) {
  const { count: favCount } = useFavorites();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"channel" | "group">("channel");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [username, setUsername] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const typeCounts = useMemo(
    () => ({
      channel: stats?.channels ?? 0,
      group: stats?.groups ?? 0,
      bot: stats?.bots ?? 0,
      saved: favCount,
    }),
    [stats, favCount],
  );

  const ticker = useMemo(() => {
    if (popular.length) {
      return popular.slice(0, 8).map((item, index) => ({
        handle: `@${item.username.replace(/^@/, "")}`,
        type: typeLabel(item.type),
        time: `${(index + 1) * 2} daq`,
      }));
    }
    return categories.slice(0, 6).map((cat, index) => ({
      handle: cat.title,
      type: "Mavzu",
      time: `${index + 1} daq`,
    }));
  }, [popular, categories]);

  function goSearch(event?: FormEvent) {
    event?.preventDefault();
    const q = query.trim();
    window.location.href = q
      ? `/search?q=${encodeURIComponent(q)}`
      : "/search";
  }

  async function onSuggest(event: FormEvent) {
    event.preventDefault();
    let handle = username.trim();
    handle = handle.replace(/^https?:\/\/t\.me\//i, "@");
    if (!handle.startsWith("@")) handle = `@${handle.replace(/^@+/, "")}`;
    if (!/^@[A-Za-z0-9_]{4,32}$/.test(handle)) {
      setMsg({
        ok: false,
        text: "Manzil @nom ko‘rinishida bo‘lishi kerak (kamida 4 ta belgi).",
      });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const response = await fetch(`${getApiBase()}/api/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: handle,
          type: kind,
          categoryId: categoryId || undefined,
          note: note || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMsg({
          ok: false,
          text: data.error || "Yuborib bo‘lmadi. Keyinroq urinib ko‘ring.",
        });
        return;
      }
      setMsg({
        ok: true,
        text: `Rahmat, volontyor! ${handle} navbatga qo‘shildi.`,
      });
      setUsername("");
      setNote("");
    } catch {
      setMsg({ ok: false, text: "Tarmoq xatosi. Keyinroq urinib ko‘ring." });
    } finally {
      setBusy(false);
    }
  }

  const botHandle = BOT_URL.replace(/^https?:\/\/t\.me\//i, "@");

  return (
    <div className="tv-home">
      <header className="tv-top">
        <Link href="/" className="tv-brand" aria-label="UnderDog bosh sahifa">
          <span className="tv-brand__mark">
            <DogMark size={26} />
          </span>
          <span className="tv-brand__name">UnderDog</span>
        </Link>
        <div className="tv-top__actions">
          <a
            className="tv-bot-pill ud-hide-sm press"
            href={BOT_URL}
            target="_blank"
            rel="noreferrer"
          >
            {botHandle}
          </a>
          <Link
            className="tv-icon-btn press"
            href="/favorites"
            aria-label="Saqlanganlar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="2.6" strokeLinejoin="round" aria-hidden>
              <path d="M6 3 H18 V21 L12 16.5 L6 21 Z" />
            </svg>
            {favCount > 0 ? (
              <span className="tv-badge">{favCount > 99 ? "99+" : favCount}</span>
            ) : null}
          </Link>
          <Link className="tv-icon-btn press" href="/search" aria-label="Qidirish">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="2.8" strokeLinecap="round" aria-hidden>
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.5 15.5 L21 21" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="tv-ticker" aria-label="Yangi qo‘shilganlar">
        <div className="tv-ticker__live">
          <span className="tv-live-dot" aria-hidden />
          JONLI
        </div>
        <div className="tv-ticker__wrap">
          <div className="tv-ticker__track">
            {[0, 1].map((copy) => (
              <span className="tv-ticker__group" key={copy} aria-hidden={copy === 1}>
                {ticker.map((item) => (
                  <span className="tv-ticker__item" key={`${copy}-${item.handle}`}>
                    <span className="tv-ticker__new">▲ YANGI</span>
                    <span className="tv-ticker__handle">{item.handle}</span>
                    <span className="tv-ticker__meta">
                      {item.type} · {item.time}
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="tv-hero">
        <div className="tv-hero__copy">
          <h1 className="tv-hero__title">
            Saqlang.{" "}
            <span className="tv-hero__accent">Toping.</span>
          </h1>
          <form className="tv-search" onSubmit={goSearch}>
            <label className="tv-search__field">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M15.5 15.5 L21 21" />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Kanal, chat yoki bot qidiring"
                aria-label="Qidiruv"
              />
            </label>
            <a className="tv-search__plus press" href="#qosh" aria-label="Kanal qo‘shish">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14121F" strokeWidth="3.2" strokeLinecap="round" aria-hidden>
                <path d="M12 4 V20 M4 12 H20" />
              </svg>
            </a>
          </form>
        </div>
        <div className="tv-hero__art ud-hide-sm" aria-hidden>
          <div className="tv-hero__card">
            <div className="tv-dog">
              <DogHero />
            </div>
          </div>
        </div>
      </section>

      <section className="tv-block">
        <h2 className="tv-block__title">Turlar</h2>
        <div className="tv-folder-grid">
          {TYPE_FOLDERS.map((folder) => (
            <Link key={folder.id} href={folder.href} className="tv-folder press">
              <span
                className="tv-folder__tab"
                style={{ background: folder.color }}
                aria-hidden
              />
              <span className="tv-folder__body">
                <span className="tv-folder__top">
                  <span
                    className="tv-folder__icon"
                    style={{ background: folder.color }}
                  >
                    <TypeIcon kind={folder.icon} />
                  </span>
                  <span className="tv-mono">
                    {formatMembers(typeCounts[folder.id])} ta
                  </span>
                </span>
                <span className="tv-folder__label">{folder.title}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="tv-block tv-block--cats">
        <h2 className="tv-block__title">Mavzular</h2>
        <div className="tv-folder-grid">
          {categories.map((cat, index) => {
            const color = CAT_COLORS[index % CAT_COLORS.length];
            return (
              <Link
                key={cat.id}
                href={`/search?category=${encodeURIComponent(cat.id)}`}
                className="tv-folder tv-folder--sm press"
              >
                <span
                  className="tv-folder__tab"
                  style={{ background: color }}
                  aria-hidden
                />
                <span className="tv-folder__body">
                  <span className="tv-folder__top">
                    <span
                      className="tv-folder__icon tv-folder__icon--sm"
                      style={{ background: color }}
                    >
                      {CAT_ICONS[cat.id] ? (
                        <span aria-hidden>{CAT_ICONS[cat.id]}</span>
                      ) : (
                        <PawIcon />
                      )}
                    </span>
                    <span className="tv-mono">
                      {formatMembers(cat.count)} ta
                    </span>
                  </span>
                  <span className="tv-folder__label">{cat.title}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="qosh" className="tv-volunteer">
        <div className="tv-volunteer__copy">
          <div className="tv-stamp">VOLONTYORLAR UCHUN</div>
          <h2>Yaxshi kanalni bilasizmi? Qo‘shing.</h2>
          <p>
            Qo‘shilgan manzil jonli lentada va qidiruv natijalarida chiqadi.
          </p>
          <p className="tv-volunteer__note">
            Faqat ochiq kanal va guruhlar. Shaxsiy yoki yopiq manzillarni
            qo‘shmang.
          </p>
        </div>
        <form className="tv-form" onSubmit={onSuggest}>
          <div className="tv-form__kinds">
            <button
              type="button"
              className={`press ${kind === "channel" ? "is-on" : ""}`}
              onClick={() => setKind("channel")}
            >
              Kanal
            </button>
            <button
              type="button"
              className={`press ${kind === "group" ? "is-on" : ""}`}
              onClick={() => setKind("group")}
            >
              Chat
            </button>
          </div>
          <label className="tv-field">
            <span>Telegram manzili</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="@kanal_nomi"
              autoCapitalize="none"
              autoComplete="off"
            />
          </label>
          <label className="tv-field">
            <span>Kategoriya</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </label>
          <label className="tv-field">
            <span>Qisqa tavsif (ixtiyoriy)</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Bu nima haqida?"
            />
          </label>
          <button className="tv-form__submit press" type="submit" disabled={busy}>
            {busy ? "Yuborilmoqda…" : "QO‘SHISH"}
          </button>
          {msg ? (
            <div
              className={`tv-form__msg ${msg.ok ? "is-ok" : "is-err"}`}
              role={msg.ok ? "status" : "alert"}
            >
              {msg.text}
            </div>
          ) : null}
        </form>
      </section>

      <section className="tv-cta">
        <div className="tv-cta__inner">
          <div>
            <h2>Telegramda ham qidiring</h2>
            <p>Botga yozing, javobni shu zahoti oling.</p>
          </div>
          <a
            className="tv-cta__btn press"
            href={BOT_URL}
            target="_blank"
            rel="noreferrer"
          >
            {botHandle}
          </a>
        </div>
      </section>

      <footer className="tv-footer">
        <div className="tv-footer__brand">
          <span>UnderDog</span>
          <p>
            UnderDog Telegram bilan rasmiy bog‘liq emas. Faqat ochiq kanal va
            guruhlar qidiriladi.
          </p>
        </div>
        <div className="tv-footer__links">
          <Link href="/">Bosh sahifa</Link>
          <Link href="/favorites">Saqlanganlar</Link>
          <a href={BOT_URL} target="_blank" rel="noreferrer">
            {botHandle}
          </a>
        </div>
      </footer>
    </div>
  );
}
