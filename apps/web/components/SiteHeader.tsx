import Link from "next/link";
import { BOT_URL } from "@/lib/brand";
import { DogMark } from "./DogMark";

export function SiteHeader() {
  return (
    <header className="ud-header">
      <div className="shell ud-header__inner">
        <Link href="/" className="ud-brand" aria-label="UnderDog home">
          <span className="ud-brand__mark">
            <DogMark />
          </span>
          <span className="ud-brand__name">UnderDog</span>
        </Link>
        <nav className="ud-nav" aria-label="Asosiy navigatsiya">
          <Link href="/categories">Kategoriyalar</Link>
          <Link href="/search">Qidiruv</Link>
          <Link href="/#qanday">Qanday ishlaydi</Link>
          <a className="press ud-nav__cta" href={BOT_URL} target="_blank" rel="noreferrer">
            Telegram bot
          </a>
        </nav>
      </div>
    </header>
  );
}
