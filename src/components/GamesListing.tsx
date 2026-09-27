import Link from "next/link";
import GameCard from "./GameCard";
import GameFilters from "./GameFilters";
import Pagination from "./Pagination";
import CatalogHero from "./CatalogHero";
import { GameSearchParams } from "@/lib/games";
import { Game } from "@/types/game";

interface GamesListingProps {
  title: string;
  subtitle: string;
  games: Game[];
  totalGamesCount: number;
  pagination: {
    totalPages: number;
    totalGames: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  currentPage: number;
  searchParams: GameSearchParams;
  featured?: Game;
  archive?: boolean;
}

export default function GamesListing({
  title,
  subtitle,
  games,
  totalGamesCount,
  pagination,
  currentPage,
  searchParams,
  featured,
  archive = false,
}: GamesListingProps) {
  const filtered = Object.entries(searchParams).some(
    ([key, value]) => key !== "page" && key !== "sortBy" && Boolean(value),
  );
  const path = archive ? "/rip" : "/";
  return (
    <>
      {!archive && !filtered && currentPage === 1 ? (
        <CatalogHero count={totalGamesCount} featured={featured} />
      ) : (
        <header className="catalog-page-heading">
          <p className="eyebrow">
            {archive
              ? "THE OFFLINE COLLECTION"
              : "THE HACKER NEWS GAME CATALOG"}
          </p>
          <h1>{archive ? "Gone, but worth remembering." : title}</h1>
          <p>
            {subtitle.replace(
              "{count}",
              totalGamesCount.toLocaleString("en-US"),
            )}
          </p>
        </header>
      )}
      <GameFilters resultCount={pagination.totalGames}>
        {games.length ? (
          <div className="games-grid">
            {games.map((game) => (
              <GameCard key={game.id} game={game} filterPath={path} />
            ))}
          </div>
        ) : (
          <div className="empty-catalog">
            <span className="eyebrow">NO MATCHES THIS TIME</span>
            <h2>
              {pagination.totalGames
                ? "This page is empty."
                : "A different search might do it."}
            </h2>
            <p>Try another keyword or give your filters a little more room.</p>
            <Link href={path} className="hn-btn-primary">
              Explore all games ↗
            </Link>
          </div>
        )}
        <Pagination
          pagination={pagination}
          currentPage={currentPage}
          searchParams={searchParams}
        />
      </GameFilters>
    </>
  );
}
