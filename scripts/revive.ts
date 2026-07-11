#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { Game } from "../src/types/game";

/**
 * Move a game from rip.json back to archive.json.
 * Use when a game was moved to RIP by mistake (e.g. after check-links).
 */

const ARCHIVE_FILE_PATH = path.join(__dirname, "data", "archive.json");
const RIP_FILE_PATH = path.join(__dirname, "data", "rip.json");

const DRY_RUN =
  process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");

function sortByReleaseDate(games: Game[]): Game[] {
  return games.sort(
    (a, b) =>
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );
}

function parseGameId(): string | null {
  const args = process.argv.slice(2).filter((arg) => arg !== "--dry-run");
  const idIndex = args.indexOf("--id");
  if (idIndex !== -1 && idIndex + 1 < args.length) {
    return args[idIndex + 1];
  }
  return args[0] ?? null;
}

function main() {
  const gameId = parseGameId();
  if (!gameId) {
    console.error("Usage: npm run revive -- <game-id>");
    console.error("       npm run revive -- --id <game-id>");
    process.exit(1);
  }

  const archiveGames: Game[] = JSON.parse(
    fs.readFileSync(ARCHIVE_FILE_PATH, "utf8")
  );
  const ripGames: Game[] = JSON.parse(fs.readFileSync(RIP_FILE_PATH, "utf8"));

  if (archiveGames.some((game) => game.id === gameId)) {
    console.error(`❌ Game ${gameId} is already in archive.json`);
    process.exit(1);
  }

  const gameIndex = ripGames.findIndex((game) => game.id === gameId);
  if (gameIndex === -1) {
    console.error(`❌ Game ${gameId} not found in rip.json`);
    process.exit(1);
  }

  const game = ripGames[gameIndex];
  console.log(`♻️  Reviving "${game.name}" (${game.id})`);

  if (DRY_RUN) {
    console.log("🧪 Dry run: would move game from rip.json to archive.json");
    process.exit(0);
  }

  const updatedRipGames = ripGames.filter((g) => g.id !== gameId);
  const updatedArchiveGames = sortByReleaseDate([...archiveGames, game]);

  fs.writeFileSync(RIP_FILE_PATH, JSON.stringify(updatedRipGames, null, 2));
  fs.writeFileSync(
    ARCHIVE_FILE_PATH,
    JSON.stringify(updatedArchiveGames, null, 2)
  );

  console.log(`✅ Removed from rip.json (${updatedRipGames.length} games)`);
  console.log(
    `✅ Added to archive.json (${updatedArchiveGames.length} games)`
  );
  console.log("\nRun `npm run compile` to update the site data.");
}

main();
