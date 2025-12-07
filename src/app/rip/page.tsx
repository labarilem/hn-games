import GamesListing from "@/components/GamesListing";
import { games as ripGames } from "@/data/ripGames";
import { GameSearchParams, filterGames } from "@/lib/games";

export default async function RipPage(props: {
  searchParams: Promise<GameSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const { games: filteredGames, pagination } = filterGames(
    ripGames,
    searchParams
  );
  const allRipGamesCount = ripGames.length;
  const currentPage = searchParams.page ? parseInt(searchParams.page) : 1;

  return (
    <GamesListing
      title="RIP Games"
      subtitle="A catalog of {count} games from the Hacker News community that are no longer available."
      games={filteredGames}
      totalGamesCount={allRipGamesCount}
      pagination={pagination}
      currentPage={currentPage}
      searchParams={searchParams}
    />
  );
}
