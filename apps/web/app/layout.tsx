import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Underdog — поиск Telegram каналов и групп",
    template: "%s · Underdog",
  },
  description:
    "Находите Telegram-каналы и группы по теме, типу и ключевым словам.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${syne.variable} ${manrope.variable}`}>
        <style>{`
          :root {
            --font-display: var(--font-syne), "Avenir Next", sans-serif;
            --font-body: var(--font-manrope), "Segoe UI", sans-serif;
          }
        `}</style>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
