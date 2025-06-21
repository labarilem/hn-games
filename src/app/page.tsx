import GameCard from "@/components/GameCard";
import GameFilters from "@/components/GameFilters";
import Pagination from "@/components/Pagination";
import { getAllGamesCount, getFilteredGames } from "@/lib/games";
import { Game } from "@/types/game";

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { games, pagination } = getFilteredGames(searchParams);
  const allGamesCount = getAllGamesCount();
  const currentPage = Number(searchParams.page) || 1;

  return (
    <div className="max-w-[1280px] mx-auto">
      <h1 className="text-5xl font-bold mb-4 text-center bg-gradient-to-r from-[#646cff] to-[#747bff] text-transparent bg-clip-text py-2">
      Hacker News Games
      </h1>
      <p className="text-gray-400 mb-8 text-center max-w-2xl mx-auto">
      A curated catalog of {allGamesCount} games created by the Hacker News community.
      </p>

      <GameFilters />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game: Game) => (
        <GameCard key={game.id} game={game} />
      ))}
      </div>

      <Pagination pagination={pagination} currentPage={currentPage} searchParams={searchParams} />
    </div>
  );
}
