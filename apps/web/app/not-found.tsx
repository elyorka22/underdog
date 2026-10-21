import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="shell">
        <div className="empty">
          <h2>Страница не найдена</h2>
          <p>Такого сообщества или раздела нет в каталоге.</p>
          <p style={{ marginTop: "1rem" }}>
            <Link className="btn btn-primary" href="/search">
              К поиску
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
