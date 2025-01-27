"use client";

import { Game } from "@/types/game";
import { useState } from "react";
import GameModal from "./GameModal";
import PlatformIcon from "./PlatformIcon";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFilterClick = (
    param: string,
    value: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    window.location.href = `/?${param}=${value}`;
  };

  const clearAuthorFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = "/";
  };

  const publicationYear = new Date(game.releaseDate).getFullYear();

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-[#242424] rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer shadow-lg flex flex-col h-full"
      >
        <div className="relative aspect-video">
          <img
            src={game.imageUrl}
            alt={game.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <span className="bg-[#646cff] text-white px-3 py-1 rounded-full text-sm font-medium">
              {game.hnPoints} points
            </span>
          </div>
          <div className="absolute top-2 left-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5
                ${
                  game.pricing === "free"
                    ? "bg-emerald-500/90 text-white"
                    : "bg-amber-500/90 text-white"
                }`}
            >
              {game.pricing === "free" ? (
                <>
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
                  Free
                </>
              ) : (
                <>
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
                  Paid
                </>
              )}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h2 className="text-xl font-bold mb-2">{game.name}</h2>
          <p className="text-gray-300 mb-4 flex-1">{game.description}</p>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {game.platforms.map((platform) => (
                <button
                  key={platform}
                  onClick={(e) => handleFilterClick("platform", platform, e)}
                  className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <PlatformIcon platform={platform} className="w-4 h-4" />
                  {platform}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={(e) => handleFilterClick("genre", game.genre, e)}
                className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
              >
                {game.genre}
              </button>
              <button
                onClick={(e) =>
                  handleFilterClick("playerMode", game.playerMode, e)
                }
                className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
              >
                {game.playerMode === "single" ? "single player" : "multiplayer"}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleFilterClick("author", game.author, e)}
                  className="text-[#646cff] hover:text-[#747bff] transition-colors"
                >
                  by {game.author}
                </button>
              </div>
              <span className="text-gray-400 text-sm">{publicationYear}</span>
            </div>
          </div>
        </div>
      </div>

      <GameModal
        game={game}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
