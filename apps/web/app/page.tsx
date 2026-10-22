import Link from "next/link";
import { CommunityList } from "@/components/CommunityList";
import { DogHero, PawIcon } from "@/components/DogMark";
import { SearchForm } from "@/components/SearchForm";
import { getCategories, getPopular } from "@/lib/api";
import { CAT_COLORS, CAT_ROTATIONS, STEPS } from "@/lib/brand";

export default async function HomePage() {
  const [popular, categories] = await Promise.all([
    getPopular(3),
    getCategories(),
  ]);

  return (
    <>
      <section className="shell ud-hero">
        <div className="ud-hero__copy">
          <div className="ud-stamp ud-stamp--pink">TELEGRAM QIDIRUV SAYTI</div>
          <h1>
            Telegramda yo&apos;qolganni it kabi{" "}
            <em>hidlab topamiz.</em>
          </h1>
          <p className="ud-hero__lead">
            Kanal, guruh, bot va xabarlar. Hammasini bitta qidiruvda toping. Bir
            marta hidla, keyin Telegramga o&apos;ting.
          </p>
          <SearchForm />
        </div>

        <div className="ud-hero__art">
          <div className="ud-dog-card">
            <div className="ud-dog-card__bubble">VAU! NIMA QIDIRYAPSAN?</div>
            <div className="ud-dog">
              <DogHero />
            </div>
            <div className="ud-dog-card__caption">
              QIDIRUV QILDING. HID OLDIM. TOPDIM.
            </div>
          </div>
        </div>
      </section>

      <div className="ud-marquee" aria-hidden>
        <div className="ud-track">
          <span>
            HID OL • TOP • HAVLA • OLIB KEL • HID OL • TOP • HAVLA • OLIB KEL •
            HID OL • TOP • HAVLA • OLIB KEL •&nbsp;
          </span>
          <span>
            HID OL • TOP • HAVLA • OLIB KEL • HID OL • TOP • HAVLA • OLIB KEL •
            HID OL • TOP • HAVLA • OLIB KEL •&nbsp;
          </span>
        </div>
      </div>

      <section id="kategoriya" className="shell ud-section--cats">
        <div className="ud-section__head">
          <h2>Qaysi hid bilan izlaymiz?</h2>
          <p>
            Mavzuni tanla, UnderDog tegishli kanal va guruhlarni olib keladi.
          </p>
        </div>
        <div className="ud-cat-grid">
          {categories.items.map((category, index) => (
            <Link
              key={category.id}
              href={`/search?category=${category.id}`}
              className="press ud-cat shadow-md"
              style={{
                background: CAT_COLORS[index % CAT_COLORS.length],
                transform: `rotate(${CAT_ROTATIONS[index % CAT_ROTATIONS.length]})`,
              }}
            >
              <PawIcon />
              <div>
                <div className="ud-cat__name">{category.title}</div>
                <div className="ud-cat__note">
                  {category.description} · {category.count} ta
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="natija" className="shell ud-section">
        <div className="ud-results-wrap">
          <div className="ud-results-copy">
            <div className="ud-stamp ud-stamp--yellow">NAMUNA</div>
            <h2>Natija shunaqa ko&apos;rinadi.</h2>
            <p>
              Har bir natijada nom, qisqa tavsif va Telegramga to&apos;g&apos;ridan-to&apos;g&apos;ri
              o&apos;tish tugmasi bo&apos;ladi. Ortiqcha reklama yo&apos;q, faqat topilgan
              narsa.
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
          <h2>Uch qadam. Uch vov.</h2>
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
            <h2>Hali ham topolmayapsanmi? Itga ayt.</h2>
            <p>
              UnderDog ko&apos;cha-ko&apos;yda emas, Telegramning eng chuqur
              burchaklarida ham hidlaydi.
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
