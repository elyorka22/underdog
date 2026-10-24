import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="ud-footer">
      <div className="shell ud-footer__inner">
        <div className="ud-footer__brand">
          <strong>UnderDog</strong>
          <span>
            UnderDog Telegram bilan rasmiy bog‘liq emas. Faqat ochiq kanal va
            guruhlar ko‘rsatiladi.
          </span>
        </div>
        <div className="ud-footer__links">
          <Link href="/categories">Kategoriyalar</Link>
          <Link href="/search">Qidiruv</Link>
          <Link href="/favorites">Sevimlilar</Link>
          <Link href="/#qanday">Qanday ishlaydi</Link>
          <Link href="/about">Haqida</Link>
        </div>
      </div>
    </footer>
  );
}
