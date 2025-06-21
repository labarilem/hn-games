import { games } from "@/data/games";
import { GameGenre, Platform, PlayerMode, Pricing } from "../types/game";

export function getAllGamesCount() {
  return games.length;
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

  if (searchParams.author) {
    filteredGames = filteredGames.filter(
      (game) => game.author === searchParams.author
    );
  }

  if (searchParams.platform) {
    filteredGames = filteredGames.filter((game) =>
      game.platforms.includes(searchParams.platform as Platform)
    );
  }

  if (searchParams.genre) {
    filteredGames = filteredGames.filter((game) =>
      game.genres.some((g) => g === searchParams.genre)
    );
  }

  if (searchParams.playerModes) {
    filteredGames = filteredGames.filter((game) =>
      game.playerModes.includes(searchParams.playerModes!)
    );
  }

  if (searchParams.pricing) {
    filteredGames = filteredGames.filter(
      (game) => game.pricing === searchParams.pricing
    );
  }

  // Apply sorting
  const sortBy = searchParams.sortBy || "releaseDate-desc";
  switch (sortBy) {
    case "releaseDate-desc":
      filteredGames.sort(
        (a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      );
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

export function getRandomFreeWebGame() {
  // Filter games that are free and playable on web
  const eligibleGames = games.filter(
    (game) =>
      game.pricing === Pricing.FREE && game.platforms.includes(Platform.WEB)
  );

  if (eligibleGames.length === 0) {
    return null; // No eligible games
  }

  // Pick a random game
  const randomGame =
    eligibleGames[Math.floor(Math.random() * eligibleGames.length)];
  return randomGame;
}
