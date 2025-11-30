#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";

/**
 * Script to sort all games store in json
 */

const ARCHIVE_FILE_PATH = path.join(__dirname, "data", "archive.json");
const RIP_FILE_PATH = path.join(__dirname, "data", "rip.json");

interface Game {
  id: string;
  releaseDate: string;
  [key: string]: any;
}

async function sortAllGames() {
  try {
    // Read archive.json
    console.log("📖 Reading archive.json...");
    const archiveContent = fs.readFileSync(ARCHIVE_FILE_PATH, "utf8");
    const archiveGames: Game[] = JSON.parse(archiveContent);

    // Read rip.json
    console.log("📖 Reading rip.json...");
    const ripContent = fs.readFileSync(RIP_FILE_PATH, "utf8");
    const ripGames: Game[] = JSON.parse(ripContent);

    // Sort archived games
    const sortedArchiveGames = archiveGames.sort(
      (a, b) =>
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );

    // Sort RIP games
    const sortedRipGames = ripGames.sort(
      (a, b) =>
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );

    // Write sorted files
    console.log("💾 Sorting archive.json...");
    const sortedArchiveContent = JSON.stringify(sortedArchiveGames, null, 2);
    fs.writeFileSync(ARCHIVE_FILE_PATH, sortedArchiveContent, "utf8");
    console.log(
      `✅ archive.json sorted (${sortedArchiveGames.length} games)`
    );

    console.log("💾 Sorting rip.json...");
    const sortedRipContent = JSON.stringify(sortedRipGames, null, 2);
    fs.writeFileSync(RIP_FILE_PATH, sortedRipContent, "utf8");
    console.log(`✅ rip.json sorted (${sortedRipGames.length} games)`);

    console.log("🎉 Successfully sorted all games");
  } catch (error) {
    console.error("❌ Error checking game links:", error);
    process.exit(1);
  }
}

// Run the script
sortAllGames();
