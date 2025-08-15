import fs from "fs";
import path from "path";
import {
  Game,
  GameGenre,
  Platform,
  PlayerMode,
  Pricing,
} from "../src/types/game";

const NEW_GAMES_PATH = path.join(__dirname, "data/new.json");
const ARCHIVE_PATH = path.join(__dirname, "data/archive.json");
const IMAGES_PATH = path.join(__dirname, "../public/images/games");

function isValidEnum<T>(
  enumObj: { [key: string]: string },
  value: string
): boolean {
  return Object.values(enumObj).includes(value);
}

function validateGame(game: any): { isValid: boolean; error?: string } {
  // Check required string fields
  const stringFields = [
    "id",
    "name",
    "description",
    "author",
    "hnUrl",
    "playUrl",
    "imageUrl",
  ];
  for (const field of stringFields) {
    if (typeof game[field] !== "string") {
      return { isValid: false, error: `Invalid ${field}` };
    }
  }

  // Validate platforms array
  if (
    !Array.isArray(game.platforms) ||
    !game.platforms.every((p: any) => isValidEnum(Platform, p))
  ) {
    return { isValid: false, error: "Invalid platforms" };
  }

  // Validate playerModes array
  if (
    !Array.isArray(game.playerModes) ||
    !game.playerModes.every((p: any) => isValidEnum(PlayerMode, p))
  ) {
    return { isValid: false, error: "Invalid playerModes" };
  }

  // Validate genre
  for (const genre of game.genres) {
    if (!isValidEnum(GameGenre, genre))
      return { isValid: false, error: "Invalid genre: " + genre };
  }

  // Validate pricing
  if (!isValidEnum(Pricing, game.pricing)) {
    return { isValid: false, error: "Invalid pricing" };
  }

  // Validate release date
  if (
    !(game.releaseDate instanceof Date) &&
    isNaN(Date.parse(game.releaseDate))
  ) {
    return { isValid: false, error: "Invalid releaseDate" };
  }

  // Validate hnPoints
  if (typeof game.hnPoints !== "number") {
    return { isValid: false, error: "Invalid hnPoints" };
  }

  // Check if image file exists
  const imagePath = path.join(IMAGES_PATH, `${game.id}.jpg`);
  if (!fs.existsSync(imagePath)) {
    return { isValid: false, error: "Missing image file" };
  }

  // Validate sourceCodeUrl
  if (game.sourceCodeUrl !== null && typeof game.sourceCodeUrl !== "string") {
    return { isValid: false, error: "Invalid sourceCodeUrl" };
  }

  return { isValid: true };
}

function main() {
  try {
    // Read files
    const newGames: any[] = JSON.parse(
      fs.readFileSync(NEW_GAMES_PATH, "utf-8")
    );
    const archiveGames: Game[] = JSON.parse(
      fs.readFileSync(ARCHIVE_PATH, "utf-8")
    );

    const validGames: Game[] = [];
    const invalidGames: { game: any; error: string }[] = [];

    // Validate each game
    for (const game of newGames) {
      const validation = validateGame(game);
      if (validation.isValid) {
        validGames.push(game as Game);
      } else {
        invalidGames.push({ game, error: validation.error! });
      }
    }

    // Update files
    if (validGames.length > 0) {
      const newArchive = [...archiveGames, ...validGames].sort(
        (a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      );
      fs.writeFileSync(ARCHIVE_PATH, JSON.stringify(newArchive, null, 2));
      fs.writeFileSync(
        NEW_GAMES_PATH,
        JSON.stringify(
          invalidGames.map((ig) => ig.game),
          null,
          2
        )
      );
    }

    // Log results
    console.log(`Successfully validated: ${validGames.length} games`);

    if (invalidGames.length > 0) {
      console.log(`\nInvalid games found: ${invalidGames.length}`);
      invalidGames.forEach(({ game, error }) => {
        console.log(`Game "${game.name}" (ID: ${game.id}): ${error}`);
      });
    }
  } catch (error) {
    console.error("Error processing games:", error);
    process.exit(1);
  }
}

main();
