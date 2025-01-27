import GameCard from "@/components/GameCard";
import { getRandomFreeWebGame } from "@/lib/games";
import { FaSync } from "react-icons/fa";

// prevent caching for this page
export const dynamic = "force-dynamic";

export default async function Random() {
  const randomGame = await getRandomFreeWebGame();

  if (!randomGame) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Random Game</h1>
        <p className="text-gray-400 mb-8">
          No free web games available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-center">Random Game</h1>
      <p className="text-gray-400 mb-8 text-center">
        Discover a random free game that you can play directly in your web
        browser.
      </p>

      <div className="flex justify-center mb-8">
        <a
          href="/random"
          className="bg-[#646cff] text-white px-6 py-3 rounded-lg hover:bg-[#747bff] transition-colors flex items-center gap-2"
        >
          <FaSync />
          Try Another Game
        </a>
      </div>

      <div className="max-w-sm mx-auto">
        <GameCard game={randomGame} />
      </div>
    </div>
  );
}
