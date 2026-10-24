import Link from "next/link";
import { CommunityList } from "@/components/CommunityList";
import { DogHero } from "@/components/DogMark";
import { HomeDiscover } from "@/components/HomeDiscover";
import { getCategories, getPopular } from "@/lib/api";
import { STEPS } from "@/lib/brand";

export default async function HomePage() {
  const [popular, categories] = await Promise.all([
    getPopular(3),
    getCategories(),
  ]);

  return (
    <>
      <section className="shell ud-hero ud-hero--home">
        <div className="ud-hero__copy">
          <div className="ud-stamp ud-stamp--pink">TELEGRAM QIDIRUV</div>
          <h1>
            Hozir qidiring.{" "}
            <em>Istalgan paytda toping.</em>
          </h1>
          <p className="ud-hero__lead">
            Telegram kanallari va guruhlarini mavzu bo‘yicha tez toping. Avval
            turini, keyin kategoriyani tanlang — yoki oddiygina so‘z yozing.
          </p>
          <HomeDiscover categories={categories.items} />
        </div>

        <div className="ud-hero__art">
          <div className="ud-dog-card">
            <div className="ud-dog-card__bubble">NIMA QIDIRYAPSIZ?</div>
            <div className="ud-dog">
              <DogHero />
            </div>
            <div className="ud-dog-card__caption">
              TANLANG. QIDIRING. TOPING.
            </div>
          </div>
        </div>
      </section>

      <div className="ud-marquee" aria-hidden>
        <div className="ud-track">
          <span>
            QIDIR • TOP • OCH • ULASH • QIDIR • TOP • OCH • ULASH • QIDIR • TOP
            • OCH • ULASH •&nbsp;
          </span>
          <span>
            QIDIR • TOP • OCH • ULASH • QIDIR • TOP • OCH • ULASH • QIDIR • TOP
            • OCH • ULASH •&nbsp;
          </span>
        </div>
      </div>

      <section id="natija" className="shell ud-section">
        <div className="ud-results-wrap">
          <div className="ud-results-copy">
            <div className="ud-stamp ud-stamp--yellow">NAMUNA</div>
            <h2>Natija shunday ko‘rinadi</h2>
            <p>
              Har bir natijada nom, qisqa tavsif va Telegramga to‘g‘ridan-to‘g‘ri
              o‘tish tugmasi bor. Keraksiz reklama yo‘q.
            </p>
            <Link className="press ud-btn ud-btn--yellow shadow-sm" href="/search">
              Barcha natijalar
            </Link>
          </div>
          <CommunityList items={popular.items} />
        </div>
      </section>

      <section id="qanday" className="shell ud-section">
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <h2>Uch qadam. Juda oddiy.</h2>
          <div className="ud-steps">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="ud-step"
                style={{ background: step.bg }}
              >
                <span className="ud-step__num">{step.num}</span>
                <span className="ud-step__title">{step.title}</span>
                <span className="ud-step__text">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ud-cta">
        <div className="shell ud-cta__inner">
          <div className="ud-cta__copy">
            <h2>Hali topa olmadingizmi?</h2>
            <p>
              Turini tanlang, kategoriyani belgilang yoki so‘z yozib qidiring —
              UnderDog ochiq katalogdan yordam beradi.
            </p>
          </div>
          <a className="press ud-cta__btn shadow-md" href="#top">
            QIDIRISHNI BOSHLASH
          </a>
        </div>
      </section>
    </>
  );
}
