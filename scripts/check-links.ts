#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { checkGameUrlForRemoval } from "./lib/url";

const ARCHIVE_FILE_PATH = path.join(__dirname, "data", "archive.json");
const RIP_FILE_PATH = path.join(__dirname, "data", "rip.json");
const DELAY_MS = 500;

interface Game {
  id: string;
  name: string;
  playUrl: string;
  releaseDate: string;
  [key: string]: unknown;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkGameLinks() {
  let dryRun = process.env.DRY_RUN === "1";
  const ids = new Set<string>();
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") dryRun = true;
    else if (args[i] === "--id") {
      const value = args[++i];
      if (!value || !/^\d+(?:,\d+)*$/.test(value))
        throw new Error("--id requires a game ID or comma-separated IDs");
      value.split(",").forEach((id) => ids.add(id));
    } else throw new Error(`Unknown option: ${args[i]}`);
  }

  const archiveGames: Game[] = JSON.parse(
    fs.readFileSync(ARCHIVE_FILE_PATH, "utf8"),
  );
  const ripGames: Game[] = JSON.parse(fs.readFileSync(RIP_FILE_PATH, "utf8"));
  if (!Array.isArray(archiveGames) || !Array.isArray(ripGames))
    throw new Error("Expected archive.json and rip.json to contain arrays");
  const missingIds = Array.from(ids).filter(
    (id) => !archiveGames.some((game) => game.id === id),
  );
  if (missingIds.length)
    throw new Error(`IDs not found in archive: ${missingIds.join(", ")}`);

  const games = archiveGames.filter(
    (game) =>
      typeof game.playUrl === "string" &&
      game.playUrl.trim() &&
      (!ids.size || ids.has(game.id)),
  );
  console.log(`Checking ${games.length} games${dryRun ? " (dry run)" : ""}...`);
  const dead: Game[] = [];
  const unknown: { game: Game; reason: string }[] = [];
  let alive = 0;

  // Sequential checks avoid flooding shared store/CDN hosts. The validator
  // retries temporary failures and confirms explicit dead responses twice.
  for (let index = 0; index < games.length; index++) {
    const game = games[index];
    console.log(
      `[${index + 1}/${games.length}] ${game.id} (${game.name}): ${game.playUrl}`,
    );
    const result = await checkGameUrlForRemoval(game.playUrl);
    if (result.status === "dead") {
      dead.push(game);
      console.log(`  DEAD: ${result.reason}`);
    } else if (result.status === "unknown") {
      const reason =
        result.reason ?? "Could not establish whether this game is available";
      unknown.push({ game, reason });
      console.log(`  INCONCLUSIVE, keeping in archive: ${reason}`);
    } else {
      alive++;
      console.log("  ALIVE");
    }
    if (index < games.length - 1) await sleep(DELAY_MS);
  }

  console.log(
    `\nResults: ${alive} alive, ${dead.length} confirmed dead, ${unknown.length} inconclusive.`,
  );
  if (unknown.length) {
    console.log("\nKept in archive; review or retry these links:");
    unknown.forEach(({ game, reason }) =>
      console.log(`  ${game.id}: ${game.name} - ${reason}`),
    );
  }
  if (!dead.length) {
    console.log("No games moved to RIP.");
    return;
  }

  console.log(`\nGames ${dryRun ? "that would move" : "to move"} to RIP:`);
  dead.forEach((game) =>
    console.log(`  ${game.id}: ${game.name} (${game.playUrl})`),
  );
  if (dryRun) return;

  const deadIds = new Set(dead.map((game) => game.id));
  const sortByDate = (a: Game, b: Game) =>
    new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
  const updatedArchive = archiveGames
    .filter((game) => !deadIds.has(game.id))
    .sort(sortByDate);
  const ripIds = new Set(ripGames.map((game) => game.id));
  const updatedRip = [
    ...ripGames,
    ...dead.filter((game) => !ripIds.has(game.id)),
  ].sort(sortByDate);

  // Save the destination first so a failed second write cannot lose a game.
  // De-duplication above makes a retry safe if only the first write succeeds.
  fs.writeFileSync(RIP_FILE_PATH, JSON.stringify(updatedRip, null, 2), "utf8");
  fs.writeFileSync(
    ARCHIVE_FILE_PATH,
    JSON.stringify(updatedArchive, null, 2),
    "utf8",
  );
  console.log(
    `Moved ${dead.length} confirmed dead games to RIP. Run npm run compile to update site data.`,
  );
}

checkGameLinks().catch((error) => {
  console.error("Error checking game links:", error);
  process.exitCode = 1;
});
