import GameFilters from "@/components/GameFilters";
import GameCard from "@/components/GameCard";
import { Game } from "@/types/game";
import { getAllGamesCount, getFilteredGames } from "@/lib/games";

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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
      <div className="flex justify-center gap-2 mt-8">
        {pagination.hasPreviousPage && (
        <a
          href={`/?page=${currentPage - 1}`}
          className="px-4 py-2 rounded-lg bg-[#242424] text-gray-300 hover:bg-[#646cff] hover:text-white transition-colors flex items-center justify-center"
          aria-label="Previous page"
        >
          {/* Left Arrow SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        )}

        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
        (page) => (
          <a
          key={page}
          href={`/?page=${page}${searchParams.search ? `&search=${searchParams.search}` : ""}${
            searchParams.platform
            ? `&platform=${searchParams.platform}`
            : ""
          }${searchParams.genre ? `&genre=${searchParams.genre}` : ""}${
            searchParams.sortBy ? `&sortBy=${searchParams.sortBy}` : ""
          }`}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentPage === page
            ? "bg-[#646cff] text-white"
            : "bg-[#242424] text-gray-300 hover:bg-[#646cff] hover:text-white"
          }`}
          >
          {page}
          </a>
        )
        )}

        {pagination.hasNextPage && (
        <a
          href={`/?page=${currentPage + 1}`}
          className="px-4 py-2 rounded-lg bg-[#242424] text-gray-300 hover:bg-[#646cff] hover:text-white transition-colors flex items-center justify-center"
          aria-label="Next page"
        >
          {/* Right Arrow SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        )}
      </div>
      )}
    </div>
  );
}
