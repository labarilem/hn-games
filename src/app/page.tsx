import GamesListing from "@/components/GamesListing";
import { games } from "@/data/games";
import { filterGames, GameSearchParams } from "@/lib/games";

export default async function Home({
  searchParams,
}: {
  searchParams: GameSearchParams;
}) {
  const { games: filteredGames, pagination } = filterGames(games, searchParams);
  const allGamesCount = games.length;
  const currentPage = searchParams.page ? parseInt(searchParams.page) : 1;

  return (
    <GamesListing
      title="Hacker News Games"
      subtitle="A curated catalog of {count} games created by the Hacker News community."
      games={filteredGames}
      totalGamesCount={allGamesCount}
      pagination={pagination}
      currentPage={currentPage}
      searchParams={searchParams}
    />
  );
}
