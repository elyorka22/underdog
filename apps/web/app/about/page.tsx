import Link from "next/link";

export const metadata = {
  title: "О сервисе",
};

export default function AboutPage() {
  return (
    <section className="section">
      <div className="shell" style={{ maxWidth: 720 }}>
        <div className="section__head">
          <div>
            <h2>О сервисе</h2>
            <p>Underdog помогает находить Telegram-сообщества</p>
          </div>
        </div>
        <div className="detail__panel">
          <p>
            Сейчас доступна пользовательская часть: сайт и Telegram-бот с одним
            каталогом. Поиск, фильтры и карточки сообществ уже работают на
            демо-данных.
          </p>
          <p>
            Сервис-помощник для автоматического сбора новых каналов и групп
            подключится следующим этапом — когда основная часть будет готова.
          </p>
          <p>
            Инфраструктура рассчитана на DigitalOcean: отдельные сервисы для
            API, веба и бота, общая логика поиска.
          </p>
          <div className="detail__actions">
            <Link className="btn btn-primary" href="/search">
              Перейти к поиску
            </Link>
            <Link className="btn btn-ghost" href="/categories">
              Смотреть категории
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
