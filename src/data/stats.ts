import { games } from "./games";
import { games as ripGames } from "./ripGames";

export const gamesCountByYear = games.reduce(
  (acc: { [key: string]: number }, game) => {
    const year = new Date(game.releaseDate).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  },
  {}
);

export const totalGamesCount = games.length;
export const totalRipGamesCount = ripGames.length;
