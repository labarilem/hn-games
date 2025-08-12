import GameCard from "./GameCard";
import GameFilters from "./GameFilters";
import Pagination from "./Pagination";
import { GameSearchParams } from "@/lib/games";
import { Game } from "@/types/game";

interface GamesListingProps {
  title: string;
  subtitle: string;
  games: Game[];
  totalGamesCount: number;
  pagination: {
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  currentPage: number;
  searchParams: GameSearchParams;
}

export default function GamesListing({
  title,
  subtitle,
  games,
  totalGamesCount,
  pagination,
  currentPage,
  searchParams,
}: GamesListingProps) {
  return (
    <div className="max-w-[1280px] mx-auto">
      <h1 className="text-5xl font-bold mb-4 text-center bg-gradient-to-r from-[#646cff] to-[#747bff] text-transparent bg-clip-text py-2">
        {title}
      </h1>
      <p className="text-gray-400 mb-8 text-center max-w-2xl mx-auto">
        {subtitle.replace("{count}", totalGamesCount.toString())}
      </p>

      <GameFilters />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game: Game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <Pagination
        pagination={pagination}
        currentPage={currentPage}
        searchParams={searchParams}
      />
    </div>
  );
}
