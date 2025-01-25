'use client';

import { Game } from "@/types/game";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface GameModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
}

export default function GameModal({ game, isOpen, onClose }: GameModalProps) {
  const router = useRouter();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFilterClick = (param: string, value: string) => {
    router.push(`/?${param}=${value}`);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="space-y-6">
          <img 
            src={game.imageUrl} 
            alt={game.name}
            className="w-full h-64 object-cover rounded-lg"
          />

          <div>
            <h2 className="text-2xl font-bold mb-2">{game.name}</h2>
            <p className="text-gray-400 mb-4">{game.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Platforms</h3>
              <div className="flex gap-2">
                {game.platforms.map(platform => (
                  <button
                    key={platform}
                    onClick={() => handleFilterClick('platform', platform)}
                    className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm text-gray-400 mb-1">Genre</h3>
              <button
                onClick={() => handleFilterClick('genre', game.genre)}
                className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
              >
                {game.genre}
              </button>
            </div>

            <div>
              <h3 className="text-sm text-gray-400 mb-1">Player Mode</h3>
              <button
                onClick={() => handleFilterClick('playerMode', game.playerMode)}
                className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
              >
                {game.playerMode}
              </button>
            </div>

            <div>
              <h3 className="text-sm text-gray-400 mb-1">Business Model</h3>
              <button
                onClick={() => handleFilterClick('businessModel', game.businessModel)}
                className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
              >
                {game.businessModel}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => handleFilterClick('author', game.author)}
              className="text-[#646cff] hover:text-[#747bff] transition-colors"
            >
              by {game.author}
            </button>
            <span className="text-gray-400">
              {game.hnPoints} points on HN
            </span>
          </div>

          <div className="flex gap-4 mt-6">
            <a
              href={game.playUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#646cff] text-white px-4 py-2 rounded text-center hover:bg-[#747bff] transition-colors"
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
  );
} 