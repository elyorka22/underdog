import type { Metadata } from "next";
import { Anton, Bowlby_One, Space_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const bowlby = Bowlby_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bowlby",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
});

const space = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: {
    default: "UnderDog — Telegram qidiruv",
    template: "%s · UnderDog",
  },
  description:
    "Telegram kanal, guruh va mavzularni bitta qidiruvda toping. Hidla. Top. O't.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className={`${bowlby.variable} ${anton.variable} ${space.variable}`}>
        <style>{`
          :root {
            --font-display: var(--font-bowlby), system-ui, sans-serif;
            --font-stamp: var(--font-anton), system-ui, sans-serif;
            --font-body: var(--font-space), system-ui, sans-serif;
          }
        `}</style>
        <div id="top">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
