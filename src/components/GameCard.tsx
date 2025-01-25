'use client';

import { Game } from "@/types/game";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GameModal from "./GameModal";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleFilterClick = (param: string, value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/?${param}=${value}`);
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="bg-[#242424] rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer shadow-lg"
      >
        <div className="relative aspect-video">
          <img 
            src={game.imageUrl} 
            alt={game.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2">
            <span className="bg-[#646cff] text-white px-3 py-1 rounded-full text-sm font-medium">
              {game.hnPoints} points
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-xl font-bold mb-2 text-white">{game.name}</h3>
          <p className="text-gray-400 mb-4 line-clamp-2 text-sm">{game.description}</p>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {game.platforms.map(platform => (
                <button
                  key={platform}
                  onClick={(e) => handleFilterClick('platform', platform, e)}
                  className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors"
                >
                  {platform}
                </button>
              ))}
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <button
                onClick={(e) => handleFilterClick('author', game.author, e)}
                className="text-[#646cff] hover:text-[#747bff] transition-colors"
              >
                by {game.author}
              </button>
              <span className="text-gray-400">
                {new Date(game.releaseDate).getFullYear()}
              </span>
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