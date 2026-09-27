import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import Analytics from "@/components/Analytics";
import Footer from "@/components/Footer";
import NavLinks from "@/components/NavLinks";

const inter = localFont({
  src: "./fonts/inter-100-900.woff2",
  weight: "100 900",
  display: "swap",
});
const display = localFont({
  src: [
    { path: "./fonts/barlow-condensed-500.woff2", weight: "500" },
    { path: "./fonts/barlow-condensed-600.woff2", weight: "600" },
    { path: "./fonts/barlow-condensed-700.woff2", weight: "700" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HN Games",
  description: "A curated catalog of games from Hacker News",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${display.variable}`}>
        <Analytics />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <header className="site-header">
          <div className="site-width header-inner">
            <Link href="/" className="brand" aria-label="HN Games home">
              <span className="brand-mark" aria-hidden="true">
                <span />
              </span>
              <span>
                HN<span className="brand-divider">/</span>GAMES
              </span>
            </Link>
            <NavLinks />
            <Link href="/submit" className="header-submit">
              Submit a game <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="site-width site-main">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
