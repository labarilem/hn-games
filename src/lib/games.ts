import { games } from "@/data/games";
import { games as ripGames } from "@/data/ripGames";
import { immediatelyPlayableGames } from "../data/immediatelyPlayableGames";
import {
  Game,
  GameGenre,
  LicenseType,
  Platform,
  PlayerMode,
  Pricing,
} from "../types/game";

export function getGameById(id: string): Game | undefined {
  return games.find((g) => g.id === id) || ripGames.find((g) => g.id === id);
}

export type GameSearchParams = {
  page?: string;
  search?: string;
  author?: string;
  platform?: Platform;
  genre?: GameGenre | GameGenre[];
  playerModes?: PlayerMode;
  pricing?: Pricing;
  license?: LicenseType;
  sortBy?: string;
};

export function getGenresFromSearchParams(
  genre: GameGenre | GameGenre[] | undefined
): GameGenre[] {
  if (!genre) return [];
  return Array.isArray(genre) ? genre : [genre];
}

export function parsePage(page?: string): number {
  const parsed = page ? parseInt(page, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

// Generic function to filter any array of games
export function filterGames(gamesList: Game[], searchParams: GameSearchParams) {
  let filteredGames = [...gamesList];
  const itemsPerPage = 9;
  const page = parsePage(searchParams.page);

  // Apply filters
  if (searchParams.search) {
    const searchTerm = searchParams.search.toLowerCase();
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

  const selectedGenres = getGenresFromSearchParams(searchParams.genre);
  if (selectedGenres.length > 0)
    filteredGames = filteredGames.filter((game) =>
      selectedGenres.every((genre) => game.genres.includes(genre))
    );

  if (searchParams.playerModes)
    filteredGames = filteredGames.filter((game) =>
      game.playerModes.includes(searchParams.playerModes!)
    );

  if (searchParams.pricing)
    filteredGames = filteredGames.filter(
      (game) => game.pricing === searchParams.pricing
    );

  if (searchParams.license)
    filteredGames = filteredGames.filter((game) =>
      searchParams.license === LicenseType.OPEN
        ? game.sourceCodeUrl !== null
        : game.sourceCodeUrl === null
    );

  // Apply sorting
  const sortBy = searchParams.sortBy || "releaseDate-desc";
  switch (sortBy) {
    case "releaseDate-desc":
    default:
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

// IDEA: provide a random game which can be immediately played
export function getRandomFreeWebGame() {
  // No eligible games, shouldn't happen but just in case
  if (immediatelyPlayableGames.length === 0) return null;

  // Pick a random game
  return immediatelyPlayableGames[
    Math.floor(Math.random() * immediatelyPlayableGames.length)
  ];
}
