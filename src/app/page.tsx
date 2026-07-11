import GamesListing from "@/components/GamesListing";
import { games } from "@/data/games";
import { filterGames, GameSearchParams, parsePage } from "@/lib/games";

export default async function Home(props: {
  searchParams: Promise<GameSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const { games: filteredGames, pagination } = filterGames(games, searchParams);
  const allGamesCount = games.length;
  const currentPage = parsePage(searchParams.page);

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
