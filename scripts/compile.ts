import fs from "fs";
import path from "path";
import { Game } from "../src/types/game";

type JsonGame = {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  releaseDate: string;
  playerMode: string[];
  author: string;
  genre: string;
  hnUrl: string;
  hnPoints: number;
  playUrl: string;
  pricing: string;
  imageUrl: string;
};
type ToStrings<T> = { [K in keyof T]: string };

const ARCHIVE_PATH = path.join(__dirname, "data/archive.json");
const GAMES_TS_PATH = path.join(__dirname, "../src/data/games.ts");

function convertJsonToTypescript(jsonGames: JsonGame[]): ToStrings<Game>[] {
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
    playerMode: `[${game.playerMode
      .map((p: string) => `PlayerMode.${p.toUpperCase()}`)
      .join(", ")}]`,
    genre: `GameGenre.${game.genre.toUpperCase()}`,
    pricing: `Pricing.${game.pricing.toUpperCase()}`,
    releaseDate: `new Date("${game.releaseDate}")`,
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

function main() {
  try {
    // Read archive.json
    const jsonContent = fs.readFileSync(ARCHIVE_PATH, "utf-8");
    const jsonGames = JSON.parse(jsonContent);

    // Convert to TypeScript games
    const typescriptGames = convertJsonToTypescript(jsonGames);

    // Generate and write TypeScript file
    const fileContent = generateTypeScriptFile(typescriptGames);
    fs.writeFileSync(GAMES_TS_PATH, fileContent);

    console.log(
      `Successfully converted ${typescriptGames.length} games to TypeScript`
    );
  } catch (error) {
    console.error("Error compiling games:", error);
    process.exit(1);
  }
}

main();
