import GameImageModal from "@/components/GameImageModal";
import PlatformIcon from "@/components/PlatformIcon";
import { formatGenre } from "@/lib/formatters";
import { getGameById } from "@/lib/games";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createReportUrl } from "../../../lib/issues";

interface GamePageProps {
  params: { gameId: string };
}

export default async function GamePage({ params }: GamePageProps) {
  const game = getGameById(params.gameId);

  if (!game) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-[#242424] rounded-lg overflow-hidden shadow-lg w-full">
        <GameImageModal imageUrl={game.imageUrl} name={game.name} />

        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-3">{game.name}</h1>
            <p className="text-gray-300">{game.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h2 className="text-sm text-gray-400 mb-1">Platforms</h2>
              <div className="flex flex-wrap gap-2">
                {game.platforms.map((platform) => (
                  <Link
                    key={platform}
                    href={`/?platform=${platform}`}
                    className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm flex items-center gap-1.5 hover:bg-[#646cff] hover:text-white transition-colors cursor-pointer"
                  >
                    <PlatformIcon platform={platform} className="w-4 h-4" />
                    {platform}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm text-gray-400 mb-1">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {game.genres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/?genre=${genre}`}
                    className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors cursor-pointer"
                  >
                    {formatGenre(genre)}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm text-gray-400 mb-1">Player Mode</h2>
              <div className="flex flex-wrap gap-2">
                {game.playerModes.map((mode) => (
                  <Link
                    key={mode}
                    href={`/?playerModes=${mode}`}
                    className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors cursor-pointer"
                  >
                    {mode === "single" ? "singleplayer" : "multiplayer"}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm text-gray-400 mb-1">Pricing</h2>
              <Link
                href={`/?pricing=${game.pricing}`}
                className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors cursor-pointer inline-block"
              >
                {game.pricing}
              </Link>
            </div>

            <div>
              <h2 className="text-sm text-gray-400 mb-1">Author</h2>
              <Link
                href={`/?author=${game.author}`}
                className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-[#646cff] hover:text-white transition-colors cursor-pointer inline-block"
              >
                {game.author}
              </Link>
            </div>

            <div>
              <h2 className="text-sm text-gray-400 mb-1">Published</h2>
              <div className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm inline-block">
                <span className="hidden sm:inline">
                  {new Date(game.releaseDate).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="sm:hidden">
                  {new Date(game.releaseDate).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-sm text-gray-400 mb-1">HN Points</h2>
              <div className="bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-full text-sm inline-block">
                {game.hnPoints} point{game.hnPoints === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="border-t border-[#363636] pt-8 mt-8">
            <div className="flex flex-wrap gap-4">
              {game.isActive && (
                <a
                  href={game.playUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 bg-[#646cff] text-white px-4 py-2.5 rounded hover:bg-[#747bff] transition-colors flex items-center justify-center"
                >
                  Play Game
                </a>
              )}
              <a
                href={game.hnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#1a1a1a] text-white px-4 py-2.5 rounded text-center hover:bg-[#2a2a2a] transition-colors border border-[#363636]"
              >
                View on HN
              </a>
              <a
                href={createReportUrl(game.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-red-900/30 text-red-400 px-4 py-2.5 rounded text-center hover:bg-red-900/40 transition-colors border border-red-900"
              >
                Report
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
