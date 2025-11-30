"use client";

import { Game, Pricing } from "@/types/game";
import Link from "next/link";
import PlatformIcon from "./PlatformIcon";
import { formatGenre } from "@/lib/formatters";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const publicationYear = new Date(game.releaseDate).getFullYear();
  const pricingBadgeClass =
    game.pricing === Pricing.FREE
      ? "bg-emerald-500/90 text-white"
      : game.pricing === Pricing.FREEMIUM
      ? "bg-violet-500/90 text-white"
      : "bg-amber-500/90 text-white";

  const pricingLabel = 
    game.pricing === Pricing.FREE
      ? "Free"
      : game.pricing === Pricing.FREEMIUM
      ? "Freemium"
      : "Paid";

  return (
    <>
      <div className="bg-[#242424] rounded-lg overflow-hidden shadow-lg flex flex-col h-full w-full">
        <Link href={`/game/${game.id}`} className="block">
          <div className="relative aspect-video w-full min-w-0 flex-shrink-0 cursor-pointer">
            <img
              src={game.imageUrl}
              alt={game.name}
              className="block w-full h-full object-fill"
              fetchPriority="low"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <span className="bg-[#646cff] text-white px-3 py-1 rounded-full text-sm font-medium">
                {game.hnPoints} point{game.hnPoints === 1 ? "" : "s"}
              </span>
            </div>
            <div className="absolute top-2 left-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${pricingBadgeClass}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {pricingLabel}
              </span>
            </div>
          </div>
        </Link>

        <div className="p-4">
          <Link href={`/game/${game.id}`} className="block mb-2">
            <h2 className="text-xl font-bold hover:text-[#646cff] transition-colors cursor-pointer">
              {game.name}
            </h2>
          </Link>
          <p className="text-gray-300 mb-4">{game.description}</p>
        </div>

        <div className="px-4 pb-4 flex flex-col">
          <div className="space-y-3 flex-grow">
            <div className="flex flex-wrap gap-2">
              {game.platforms.map((platform) => (
                <Link
                  key={platform}
                  href={`/?platform=${platform}`}
                  className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <PlatformIcon platform={platform} className="w-4 h-4" />
                  {platform}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {game.genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/?genre=${genre}`}
                  className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
                >
                  {formatGenre(genre)}
                </Link>
              ))}
              {game.playerModes.map((mode) => (
                <Link
                  key={mode}
                  href={`/?playerModes=${mode}`}
                  className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
                >
                  {mode === "single" ? "singleplayer" : "multiplayer"}
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Link
                  href={`/?author=${game.author}`}
                  className="text-[#646cff] hover:text-[#747bff] transition-colors"
                >
                  by {game.author}
                </Link>
              </div>
              <span className="text-gray-400 text-sm">{publicationYear}</span>
            </div>
          </div>

          {game.isActive && (
            <div className="mt-4 pt-3">
              <a
                href={game.playUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block w-full bg-[#646cff] text-white px-4 py-2 rounded-md text-center font-medium hover:bg-[#747bff] transition-colors"
              >
                Play
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
