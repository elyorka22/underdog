import Link from "next/link";

export const metadata = {
  title: "Haqida",
};

export default function AboutPage() {
  return (
    <section className="shell ud-page">
      <div className="ud-stamp ud-stamp--yellow">HAQIDA</div>
      <div className="ud-detail">
        <h1>UnderDog nima?</h1>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5, color: "var(--muted)" }}>
          UnderDog — Telegram kanallari va guruhlarini mavzu bo‘yicha topish
          xizmati. Sayt va bot bir xil katalogdan ishlaydi.
        </p>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5, color: "var(--muted)" }}>
          UnderDog Telegram bilan rasmiy bog‘liq emas. Faqat ochiq kanal va
          guruhlar ko‘rsatiladi.
        </p>
        <div className="ud-detail__actions">
          <Link className="press ud-btn ud-btn--pink shadow-sm" href="/search">
            Qidirish
          </Link>
          <Link className="press ud-btn ud-btn--white shadow-sm" href="/categories">
            Kategoriyalar
          </Link>
        </div>
      </div>
    </section>
  );
}
