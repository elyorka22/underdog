import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell ud-page">
      <div className="ud-empty">
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>
          Sahifa topilmadi
        </h2>
        <p>Bunday kanal yoki bo&apos;lim katalogda yo&apos;q.</p>
        <p style={{ marginTop: "1rem" }}>
          <Link className="press ud-btn ud-btn--pink shadow-sm" href="/search">
            Qidiruvga
          </Link>
        </p>
      </div>
    </section>
  );
}
