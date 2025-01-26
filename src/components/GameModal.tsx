"use client";

import { Game } from "@/types/game";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PlatformIcon from "./PlatformIcon";

interface GameModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
}

export default function GameModal({ game, isOpen, onClose }: GameModalProps) {
  const router = useRouter();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFilterClick = (param: string, value: string) => {
    router.push(`/?${param}=${value}`);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#1a1a1a] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="relative -mx-6 -mt-6">
            <img
              src={game.imageUrl}
              alt={game.name}
              className="w-full h-64 object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{game.name}</h2>
              <p className="text-gray-400 mb-4">{game.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-gray-400 mb-1">Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {game.platforms.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => handleFilterClick("platform", platform)}
                      className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm flex items-center gap-1.5 hover:bg-[#646cff] hover:text-white transition-colors"
                    >
                      <PlatformIcon platform={platform} className="w-4 h-4" />
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-1">Genre</h3>
                <button
                  onClick={() => handleFilterClick("genre", game.genre)}
                  className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
                >
                  {game.genre}
                </button>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-1">Player Mode</h3>
                <button
                  onClick={() =>
                    handleFilterClick("playerMode", game.playerMode)
                  }
                  className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
                >
                  {game.playerMode === "single"
                    ? "single player"
                    : "multiplayer"}
                </button>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-1">Pricing</h3>
                <button
                  onClick={() => handleFilterClick("pricing", game.pricing)}
                  className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
                >
                  {game.pricing}
                </button>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-1">Author</h3>
                <button
                  onClick={() => handleFilterClick("author", game.author)}
                  className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
                >
                  {game.author}
                </button>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-1">Published</h3>
                <div className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm inline-block">
                  <span className="hidden sm:inline">
                    {new Date(game.releaseDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="sm:hidden">
                    {new Date(game.releaseDate).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-1">HN Points</h3>
                <div className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm inline-block">
                  {game.hnPoints}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <a
                href={game.playUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#646cff] text-white px-4 py-2 rounded hover:bg-[#747bff] transition-colors flex items-center justify-center"
              >
                Play Game
              </a>
              <a
                href={game.hnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#242424] text-white px-4 py-2 rounded text-center hover:bg-[#2a2a2a] transition-colors border border-[#363636]"
              >
                View on HN
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
