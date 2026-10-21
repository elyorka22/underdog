import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <p>Underdog · каталог Telegram-сообществ</p>
        <p>
          <Link href="/search">Поиск</Link>
          {" · "}
          <Link href="/categories">Категории</Link>
          {" · "}
          <Link href="/about">О сервисе</Link>
        </p>
      </div>
    </footer>
  );
}
