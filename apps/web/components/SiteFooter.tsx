import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="ud-footer">
      <div className="shell ud-footer__inner">
        <div className="ud-footer__brand">
          <strong>UnderDog</strong>
          <span>
            UnderDog Telegram bilan rasmiy bog&apos;liq emas. Faqat ochiq kanal
            va guruhlar qidiriladi.
          </span>
        </div>
        <div className="ud-footer__links">
          <Link href="/categories">Kategoriyalar</Link>
          <Link href="/search">Natijalar</Link>
          <Link href="/#qanday">Qanday ishlaydi</Link>
          <Link href="/about">Haqida</Link>
        </div>
      </div>
    </footer>
  );
}
