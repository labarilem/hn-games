import { games } from "@/data/games";
import { immediatelyPlayableGames } from "../data/immediatelyPlayableGames";
import { Game, GameGenre, Platform, PlayerMode } from "../types/game";

export function getAllGamesCount() {
  return games.length;
}

export function getGameById(id: string): Game | undefined {
  return games.find(game => game.id === id);
}

// TODO: add types for searchParams and pagination
export function getFilteredGames(
  searchParams: {
    [key: string]: string | string[] | undefined;
  } & { playerModes?: PlayerMode; genre?: GameGenre }
) {
  let filteredGames = [...games];
  const itemsPerPage = 9;
  const page = Number(searchParams.page) || 1;

  // Apply filters
  if (searchParams.search) {
    const searchTerm = searchParams.search.toString().toLowerCase();
    filteredGames = filteredGames.filter(
      (game) =>
        game.name.toLowerCase().includes(searchTerm) ||
        game.description.toLowerCase().includes(searchTerm)
    );
  }

  if (searchParams.author)
    filteredGames = filteredGames.filter(
      (game) => game.author === searchParams.author
    );

  if (searchParams.platform)
    filteredGames = filteredGames.filter((game) =>
      game.platforms.includes(searchParams.platform as Platform)
    );

  if (searchParams.genre)
    filteredGames = filteredGames.filter((game) =>
      game.genres.some((g) => g === searchParams.genre)
    );

  if (searchParams.playerModes)
    filteredGames = filteredGames.filter((game) =>
      game.playerModes.includes(searchParams.playerModes!)
    );

  if (searchParams.pricing)
    filteredGames = filteredGames.filter(
      (game) => game.pricing === searchParams.pricing
    );

  // Apply sorting
  const sortBy = searchParams.sortBy || "releaseDate-desc";
  switch (sortBy) {
    case "releaseDate-desc":
      // Games are already statically sorted by desc releaseDate  by the compiler
      // so we don't need to sort them again
      // filteredGames.sort(
      //   (a, b) =>
      //     new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      // );
      break;
    case "releaseDate-asc":
      filteredGames.sort(
        (a, b) =>
          new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
      );
      break;
    case "hnPoints-desc":
      filteredGames.sort((a, b) => b.hnPoints - a.hnPoints);
      break;
    case "hnPoints-asc":
      filteredGames.sort((a, b) => a.hnPoints - b.hnPoints);
      break;
  }

  // Calculate pagination
  const totalGames = filteredGames.length;
  const totalPages = Math.ceil(totalGames / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGames = filteredGames.slice(startIndex, endIndex);

  return {
    games: paginatedGames,
    pagination: {
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

// IDEA: provide a random game which can be immediately played
export function getRandomFreeWebGame() {
  // No eligible games, shouldn't happen but just in case
  if (immediatelyPlayableGames.length === 0) return null;

  // Pick a random game
  return immediatelyPlayableGames[
    Math.floor(Math.random() * immediatelyPlayableGames.length)
  ];
}
