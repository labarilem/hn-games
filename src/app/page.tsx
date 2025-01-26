import GameFilters from "@/components/GameFilters";
import GameCard from "@/components/GameCard";
import { Game } from "@/types/game";

async function getGames(searchParams: { [key: string]: string | string[] | undefined }) {
  const queryString = new URLSearchParams();
  
  // Ensure page and pageSize are included in the query
  queryString.set('page', (searchParams.page as string) || '1');
  queryString.set('pageSize', '9'); // Fixed page size of 9 items
  
  // Add other search params
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== 'page' && key !== 'pageSize') {
      queryString.append(key, value.toString());
    }
  });

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/games?${queryString.toString()}`, {
    cache: 'no-store'
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch games');
  }

  return res.json();
}

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { games, pagination } = await getGames(searchParams);
  const currentPage = Number(searchParams.page) || 1;

  return (
    <div className="max-w-[1280px] mx-auto">
      <h1 className="text-5xl font-bold mb-4 text-center bg-gradient-to-r from-[#646cff] to-[#747bff] text-transparent bg-clip-text">
        HN Games Catalog
      </h1>
      <p className="text-gray-400 mb-8 text-center max-w-2xl mx-auto">
        Discover and explore games shared by the Hacker News community. A curated collection of indie games, demos, and experiments.
      </p>

      <GameFilters />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
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
              className="px-4 py-2 rounded-lg bg-[#242424] text-gray-300 hover:bg-[#646cff] hover:text-white transition-colors"
            >
              Previous
            </a>
          )}
          
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <a
              key={page}
              href={`/?page=${page}${searchParams.search ? `&search=${searchParams.search}` : ''}${
                searchParams.platform ? `&platform=${searchParams.platform}` : ''
              }${searchParams.genre ? `&genre=${searchParams.genre}` : ''}${
                searchParams.sortBy ? `&sortBy=${searchParams.sortBy}` : ''
              }`}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-[#646cff] text-white'
                  : 'bg-[#242424] text-gray-300 hover:bg-[#646cff] hover:text-white'
              }`}
            >
              {page}
            </a>
          ))}

          {pagination.hasNextPage && (
            <a
              href={`/?page=${currentPage + 1}`}
              className="px-4 py-2 rounded-lg bg-[#242424] text-gray-300 hover:bg-[#646cff] hover:text-white transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
} 