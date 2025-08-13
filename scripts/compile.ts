import fs from "fs";
import path from "path";
import { Game, GameGenre, PlayerMode } from "../src/types/game";

type JsonGame = {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  releaseDate: string;
  playerModes: PlayerMode[];
  author: string;
  genres: GameGenre[];
  hnUrl: string;
  hnPoints: number;
  playUrl: string;
  pricing: string;
  imageUrl: string;
};
type ToStrings<T> = { [K in keyof T]: string };

function sortSingleBeforeMulti(a: string, b: string) {
  if (a === b) return 0; // no change if both are the same
  if (a === PlayerMode.SINGLE) return -1; // single player comes first
  if (b === PlayerMode.SINGLE) return 1;
  return a.localeCompare(b); // sort alphabetically otherwise
}

function convertJsonToTypescript(
  jsonGames: JsonGame[],
  isActive: boolean
): ToStrings<Game>[] {
  return jsonGames.map((game) => ({
    id: `"${game.id}"`,
    name: `"${game.name}"`,
    description: `"${game.description}"`,
    author: `"${game.author}"`,
    hnPoints: `${game.hnPoints}`,
    hnUrl: `"${game.hnUrl}"`,
    imageUrl: `"${game.imageUrl}"`,
    playUrl: `"${game.playUrl}"`,
    platforms: `[${game.platforms
      .map((p: string) => `Platform.${p.toUpperCase()}`)
      .join(", ")}]`,
    playerModes: `[${game.playerModes
      .sort(sortSingleBeforeMulti)
      .map((p: string) => `PlayerMode.${p.toUpperCase()}`)
      .join(", ")}]`,
    genres: `[${game.genres
      .map((g: GameGenre) => `GameGenre.${g.toUpperCase()}`)
      .join(", ")}]`,
    pricing: `Pricing.${game.pricing.toUpperCase()}`,
    releaseDate: `new Date("${game.releaseDate}")`,
    isActive: isActive.toString(),
  }));
}

function generateTypeScriptFile(games: ToStrings<Game>[]): string {
  const serializedGames = games
    .map((game) =>
      Object.getOwnPropertyNames(game)
        .map((prop) => `${prop}: ${game[prop as keyof ToStrings<Game>]},`)
        .join("\n")
    )
    .join("},\n{");
  return `
    import { Game, GameGenre, Platform, PlayerMode, Pricing } from "@/types/game";
    
    export const games: Game[] = [
        {${serializedGames}}
    ];
    `;
}

function compileToTs(
  jsonPath: string,
  tsPath: string,
  opts: { isActive: boolean }
): Game[] {
  // Read archive.json
  const jsonContent = fs.readFileSync(jsonPath, "utf-8");
  const jsonGames = JSON.parse(jsonContent);
  // Convert to TypeScript games
  const typescriptGames = convertJsonToTypescript(jsonGames, opts.isActive);
  // Generate and write TypeScript file
  const fileContent = generateTypeScriptFile(typescriptGames);
  fs.writeFileSync(tsPath, fileContent);
  console.log(
    `Compiled ${typescriptGames.length} games from ${path.basename(jsonPath)} to ${path.basename(tsPath)}`
  );
  return jsonGames;
}

function compileStatsToTs(games: Game[], ripGames: Game[], tsPath: string) {
  // base stats
  let compiledStats = `
import { games } from "./games";
import { games as ripGames } from "./ripGames";

export const totalGamesCount = games.length;
export const totalRipGamesCount = ripGames.length;
    
`;

  // games count by year
  const gamesCountByYear = games.reduce(
    (acc: { [key: string]: number }, game) => {
      const year = new Date(game.releaseDate).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    },
    {}
  );
  compiledStats += `export const gamesCountByYear = ${JSON.stringify(gamesCountByYear)};`;

  fs.writeFileSync(tsPath, compiledStats);
  console.log(`Compiled stats to ${path.basename(tsPath)}`);
}

function main() {
  let games: Game[] = [];
  let ripGames: Game[] = [];

  // archive
  try {
    const ARCHIVE_PATH = path.join(__dirname, "data/archive.json");
    const GAMES_TS_PATH = path.join(__dirname, "../src/data/games.ts");
    games = compileToTs(ARCHIVE_PATH, GAMES_TS_PATH, { isActive: true });
  } catch (error) {
    console.error("Error compiling games:", error);
    process.exit(1);
  }

  // rip
  try {
    const RIP_PATH = path.join(__dirname, "data/rip.json");
    const RIP_TS_PATH = path.join(__dirname, "../src/data/ripGames.ts");
    ripGames = compileToTs(RIP_PATH, RIP_TS_PATH, { isActive: false });
  } catch (error) {
    console.error("Error compiling RIP games:", error);
    process.exit(1);
  }

  // stats
  try {
    const STATS_PATH = path.join(__dirname, "../src/data/stats.ts");
    compileStatsToTs(games, ripGames, STATS_PATH);
  } catch (error) {
    console.error("Error compiling stats:", error);
    process.exit(1);
  }
}

main();
