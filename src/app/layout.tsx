import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Analytics from "@/components/Analytics";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HN Games",
  description: "A curated catalog of games from Hacker News",
  icons: {
    icon: "/icon.ico",
    shortcut: "/icon.ico",
    apple: "/icon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} min-h-screen bg-[#1a1a1a] flex flex-col`}
      >
        <Analytics />
        <nav className="bg-[#242424] shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-2">
                <a href="/" className="flex items-center gap-2">
                  <Image
                    src="/icon.svg"
                    alt="HN Games Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  <span className="hidden sm:inline text-2xl font-bold text-white">
                    HN Games
                  </span>
                </a>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="/random"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Random
                </a>
                <a
                  href="/newsletter"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Newsletter
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8 flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
