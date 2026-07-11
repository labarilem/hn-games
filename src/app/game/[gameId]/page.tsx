import GameImageModal from "@/components/GameImageModal";
import PlatformIcon from "@/components/PlatformIcon";
import { formatGenre } from "@/lib/formatters";
import { getGameById } from "@/lib/games";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createReportUrl } from "../../../lib/issues";

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

export default async function GamePage(props: GamePageProps) {
  const params = await props.params;
  const game = getGameById(params.gameId);

  if (!game) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="hn-surface w-full overflow-hidden">
        <GameImageModal imageUrl={game.imageUrl} name={game.name} />

        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-3">{game.name}</h1>
            <p className="text-gray-400 leading-relaxed">{game.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h2 className="text-sm text-gray-400 mb-1">Platforms</h2>
              <div className="flex flex-wrap gap-2">
                {game.platforms.map((platform) => (
                  <Link
                    key={platform}
                    href={`/?platform=${encodeURIComponent(platform)}`}
                    className="hn-tag-platform"
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
                    href={`/?genre=${encodeURIComponent(genre)}`}
                    className="hn-tag-genre"
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
                    href={`/?playerModes=${encodeURIComponent(mode)}`}
                    className="hn-tag-mode"
                  >
                    {mode === "single" ? "singleplayer" : "multiplayer"}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm text-gray-400 mb-1">Pricing</h2>
              <Link
                href={`/?pricing=${encodeURIComponent(game.pricing)}`}
                className="hn-tag-genre inline-block"
              >
                {game.pricing}
              </Link>
            </div>

            <div>
              <h2 className="text-sm text-gray-400 mb-1">Author</h2>
              <Link
                href={`/?author=${encodeURIComponent(game.author)}`}
                className="hn-tag-genre inline-block"
              >
                {game.author}
              </Link>
            </div>

            <div>
              <h2 className="text-sm text-gray-400 mb-1">Published</h2>
              <div className="hn-meta-pill">
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
              <div className="hn-meta-pill">
                {game.hnPoints} point{game.hnPoints === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 mt-8">
            <div className="flex flex-wrap gap-4">
              {game.isActive && (
                <a
                  href={game.playUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 hn-btn-primary px-4 py-2.5 rounded flex items-center justify-center"
                >
                  Play Game
                </a>
              )}
              <a
                href={game.hnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 hn-btn-secondary px-4 py-2.5"
              >
                View on HN
              </a>
              {game.sourceCodeUrl && (
                <a
                  href={game.sourceCodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 hn-btn-secondary px-4 py-2.5"
                >
                  Source Code
                </a>
              )}
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
