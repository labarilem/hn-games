import GameImageModal from "@/components/GameImageModal";
import PlatformIcon from "@/components/PlatformIcon";
import { formatGenre } from "@/lib/formatters";
import { getGameById } from "@/lib/games";
import { Platform } from "@/types/game";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createReportUrl } from "@/lib/issues";

export default async function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = getGameById(gameId);
  if (!game) notFound();
  const path = game.isActive ? "/" : "/rip";
  return (
    <article className="game-detail">
      <Link href={path} className="back-link">
        ← Back to {game.isActive ? "the catalog" : "the archive"}
      </Link>
      <header className="detail-heading">
        <div>
          <p className="eyebrow">
            {game.isActive ? "FROM THE HN COMMUNITY" : "THE OFFLINE COLLECTION"}
            <span aria-hidden="true"> / </span>
            {new Date(game.releaseDate).getUTCFullYear()}
          </p>
          <h1>{game.name}</h1>
        </div>
        <a href={game.hnUrl} target="_blank" rel="noopener noreferrer">
          ▲ {game.hnPoints.toLocaleString("en-US")} HN points ↗
        </a>
      </header>
      <div className="detail-layout">
        <div>
          <GameImageModal imageUrl={game.imageUrl} name={game.name} />
          <section className="detail-about">
            <h2>About the game</h2>
            <p>
              {game.description ||
                "Explore this game and its original Hacker News discussion."}
            </p>
            <div className="detail-genres">
              {game.genres.map((genre) => (
                <Link
                  key={genre}
                  href={`${path}?genre=${genre}`}
                  className="hn-tag-genre"
                >
                  {formatGenre(genre)}
                </Link>
              ))}
            </div>
          </section>
        </div>
        <aside className="detail-panel" aria-label="Game information">
          <div className="detail-price">
            {game.isActive ? game.pricing : "Currently offline"}
          </div>
          <p className="detail-price-note">
            {!game.isActive
              ? "This game is preserved in the catalog for reference."
              : game.pricing === "freemium"
                ? "Free to start, with optional paid content."
                : game.pricing === "free"
                  ? "Explore the game on its creator’s site."
                  : "Visit the creator’s site for current pricing."}
          </p>
          {game.isActive && (
            <a
              href={game.playUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hn-btn-primary detail-play"
            >
              {game.platforms.includes(Platform.WEB)
                ? "Play game"
                : "Get the game"}
              <span aria-hidden="true">↗</span>
            </a>
          )}
          <dl className="detail-facts">
            <div>
              <dt>Platforms</dt>
              <dd>
                {game.platforms.map((platform) => (
                  <Link key={platform} href={`${path}?platform=${platform}`}>
                    <PlatformIcon platform={platform} className="w-4 h-4" />
                    {platform === "web"
                      ? "Browser"
                      : platform === "ios"
                        ? "iOS"
                        : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Link>
                ))}
              </dd>
            </div>
            <div>
              <dt>Players</dt>
              <dd>
                {game.playerModes.map((mode) => (
                  <Link key={mode} href={`${path}?playerModes=${mode}`}>
                    {mode === "single" ? "Single player" : "Multiplayer"}
                  </Link>
                ))}
              </dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>
                <Link
                  href={`${path}?author=${encodeURIComponent(game.author)}`}
                >
                  {game.author}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Shared on Hacker News</dt>
              <dd>
                {new Date(game.releaseDate).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </dd>
            </div>
          </dl>
          <div className="detail-links">
            <a href={game.hnUrl} target="_blank" rel="noopener noreferrer">
              Read the HN discussion <span aria-hidden="true">↗</span>
            </a>
            {typeof game.sourceCodeUrl === "string" && (
              <a
                href={game.sourceCodeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore the source code <span aria-hidden="true">↗</span>
              </a>
            )}
            <a
              href={createReportUrl(game.id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Report an issue <span aria-hidden="true">↗</span>
            </a>
          </div>
        </aside>
      </div>
    </article>
  );
}
