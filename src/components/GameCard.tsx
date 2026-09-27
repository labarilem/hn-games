import { Game, Pricing } from "@/types/game";
import Link from "next/link";
import PlatformIcon from "./PlatformIcon";
import { formatGenre } from "@/lib/formatters";

export default function GameCard({
  game,
  filterPath = "/",
}: {
  game: Game;
  filterPath?: string;
}) {
  const pricing =
    game.pricing === Pricing.FREE
      ? "Free"
      : game.pricing === Pricing.FREEMIUM
        ? "Freemium"
        : "Paid";
  return (
    <article className="game-card">
      <Link
        href={`/game/${game.id}`}
        className="game-art"
        aria-label={`View ${game.name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.imageUrl}
          alt={`${game.name} screenshot`}
          width={1280}
          height={720}
          loading="lazy"
          decoding="async"
        />
        <span className="game-art-action" aria-hidden="true">
          View game ↗
        </span>
        {!game.isActive && <span className="unavailable-label">Offline</span>}
      </Link>
      <div className="game-card-body">
        <div className="game-card-heading">
          <Link href={`/game/${game.id}`}>
            <h2>{game.name}</h2>
          </Link>
          <Link
            href={`${filterPath}?pricing=${game.pricing}`}
            className={`game-price ${game.pricing === Pricing.FREE ? "is-free" : ""}`}
          >
            {pricing}
          </Link>
        </div>
        <p className="game-description">
          {game.description ||
            "Discover this game from the Hacker News community."}
        </p>
        <div className="game-genres">
          {game.genres.map((genre) => (
            <Link
              key={genre}
              href={`${filterPath}?genre=${encodeURIComponent(genre)}`}
            >
              {formatGenre(genre)}
            </Link>
          ))}
        </div>
        <div className="game-card-meta">
          <div className="game-platforms">
            {game.platforms.map((platform) => (
              <Link
                key={platform}
                href={`${filterPath}?platform=${platform}`}
                title={platform === "web" ? "Browser" : platform}
                aria-label={`Browse ${platform} games`}
              >
                <PlatformIcon platform={platform} className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
          <a
            href={game.hnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="game-points"
            aria-label={`${game.hnPoints} Hacker News points; open discussion`}
          >
            ▲ {game.hnPoints.toLocaleString("en-US")}
          </a>
          <span className="game-year">
            {new Date(game.releaseDate).getUTCFullYear()}
          </span>
        </div>
        <div className="game-card-bottom">
          <Link
            href={`${filterPath}?author=${encodeURIComponent(game.author)}`}
            className="game-author"
            title={`Games by ${game.author}`}
          >
            by {game.author}
          </Link>
          {game.isActive ? (
            <a
              href={game.playUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="game-play"
              aria-label={`Play ${game.name}`}
            >
              Play <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <Link href={`/game/${game.id}`} className="game-play">
              Details ↗
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
