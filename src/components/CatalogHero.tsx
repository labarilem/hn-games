import Link from "next/link";
import { Game } from "@/types/game";
import { formatGenre } from "@/lib/formatters";
export default function CatalogHero({
  count,
  featured,
}: {
  count: number;
  featured?: Game;
}) {
  return (
    <section className="catalog-hero" aria-labelledby="catalog-title">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="status-dot" /> THE HACKER NEWS GAME CATALOG
        </p>
        <h1 id="catalog-title">
          Independent games.
          <br />
          <span>Unexpected finds.</span>
        </h1>
        <p className="hero-description">
          Weekend experiments. Ambitious worlds. Your next favorite game, made
          by someone from Hacker News.
        </p>
        <div className="hero-bottom">
          <span>
            <strong>{count.toLocaleString("en-US")}</strong> games to explore
          </span>
          <Link href="/random">
            Find your next game <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      {featured && (
        <Link
          href={`/game/${featured.id}`}
          className="featured-game"
          aria-label={`Explore ${featured.name}, a community favorite`}
        >
          {/* The catalog stores already compressed screenshots. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featured.imageUrl}
            alt={`${featured.name} gameplay`}
            width={1280}
            height={720}
            fetchPriority="high"
          />
          <span className="featured-shade" />
          <span className="featured-label">
            <span aria-hidden="true">↗</span> COMMUNITY FAVORITE
          </span>
          <div className="featured-caption">
            <div>
              <span className="eyebrow">
                {featured.genres.slice(0, 2).map(formatGenre).join(" / ")}
              </span>
              <h2>{featured.name}</h2>
              <p>
                ▲ {featured.hnPoints.toLocaleString("en-US")} points on Hacker
                News
              </p>
            </div>
            <span className="featured-arrow" aria-hidden="true">
              ↗
            </span>
          </div>
        </Link>
      )}
    </section>
  );
}
