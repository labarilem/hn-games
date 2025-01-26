import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hacker News Games",
  description: "A curated catalog of games from Hacker News",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#1a1a1a]`}>
        <nav className="bg-[#242424] shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-2">
                <Image 
                  src="/icon.svg"
                  alt="HN Games Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <a
                  href="/"
                  className="flex items-center text-2xl font-bold text-white"
                >
                  HN Games
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
                  href="/submit" 
                  className="bg-[#646cff] text-white px-4 py-2 rounded hover:bg-[#747bff] transition-colors"
                >
                  Submit Game
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
