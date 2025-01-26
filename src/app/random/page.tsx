import GameCard from "@/components/GameCard";
import { games } from "@/data/games";

export default function Random() {
  // Filter games that are free and playable on web
  const eligibleGames = games.filter(
    game => game.pricing === 'free' && game.platforms.includes('web')
  );

  if (eligibleGames.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Random Game</h1>
        <p className="text-gray-400 mb-8">
          No free web games available at the moment.
        </p>
      </div>
    );
  }

  // Pick a random game
  const randomGame = eligibleGames[Math.floor(Math.random() * eligibleGames.length)];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-center">Random Game</h1>
      <p className="text-gray-400 mb-8 text-center">
        Discover a random free game that you can play directly in your web browser.
      </p>

      <div className="flex justify-center mb-8">
        <a
          href="/random"
          className="bg-[#646cff] text-white px-6 py-3 rounded-lg hover:bg-[#747bff] transition-colors flex items-center gap-2"
        >
          <span>⟳</span>
          Try Another Game
        </a>
      </div>

      <div className="max-w-sm mx-auto">
        <GameCard game={randomGame} />
      </div>
    </div>
  );
} 