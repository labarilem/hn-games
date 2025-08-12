import { games } from "./games";

export const gamesCountByYear = games.reduce(
  (acc: { [key: string]: number }, game) => {
    const year = new Date(game.releaseDate).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  },
  {}
);
