#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { isValidGameUrl } from "./lib/url";

/**
 * Script to check playUrls of games in archive.json and move invalid ones to rip.json
 */

const ARCHIVE_FILE_PATH = path.join(__dirname, "data", "archive.json");
const RIP_FILE_PATH = path.join(__dirname, "data", "rip.json");
const BATCH_SIZE = 5;
const DELAY_MS = 500;

interface Game {
  id: string;
  name: string;
  playUrl: string;
  [key: string]: any;
}

// Sleep utility function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Check if a game's URL is valid
async function checkGameUrl(game: Game): Promise<{ isValid: boolean; reason: string }> {
  if (!game.playUrl) {
    return { isValid: true, reason: "No URL to check" }; // Skip games without URLs
  }

  console.log(`  🔗 Checking URL for ${game.id} (${game.name}): ${game.playUrl}`);

  try {
    const result = await isValidGameUrl(game.playUrl);
    
    if (result.isValid) {
      console.log(`  ✅ URL is valid for ${game.id}`);
      return { isValid: true, reason: "URL is valid" };
    } else {
      console.log(`  ❌ URL is invalid for ${game.id}: ${game.playUrl}`);
      return { isValid: false, reason: "URL validation failed" };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.log(`  ❌ Error checking URL for ${game.id}: ${errorMsg}`);
    return { isValid: false, reason: `Error: ${errorMsg}` };
  }
}

// Process a batch of games
async function processBatch(games: Game[], batchIndex: number): Promise<Game[]> {
  console.log(
    `\n🔄 Processing batch ${batchIndex + 1} (${games.length} games)`
  );

  const invalidGames: Game[] = [];

  for (let i = 0; i < games.length; i++) {
    const game = games[i];

    const { isValid, reason } = await checkGameUrl(game);
    
    if (!isValid && game.playUrl) {
      console.log(`  💀 Game ${game.id} will be moved to RIP: ${reason}`);
      invalidGames.push(game);
    }

    // Wait between requests (except for the last item)
    if (i < games.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`  📊 Batch ${batchIndex + 1} complete: ${invalidGames.length} invalid URLs found`);
  return invalidGames;
}

// Split array into chunks
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function checkGameLinks() {
  try {
    console.log("🔍 Starting game URL validation...");

    // Read archive.json
    console.log("📖 Reading archive.json...");
    const archiveContent = fs.readFileSync(ARCHIVE_FILE_PATH, "utf8");
    const archiveGames: Game[] = JSON.parse(archiveContent);

    // Read rip.json
    console.log("📖 Reading rip.json...");
    const ripContent = fs.readFileSync(RIP_FILE_PATH, "utf8");
    const ripGames: Game[] = JSON.parse(ripContent);

    // Filter games that have playUrls to check
    const gamesWithUrls = archiveGames.filter(game => game.playUrl && game.playUrl.trim() !== "");

    console.log(`🎮 Found ${gamesWithUrls.length} games with URLs to check out of ${archiveGames.length} total games`);

    if (gamesWithUrls.length === 0) {
      console.log("ℹ️  No games with URLs found to check. Exiting.");
      return;
    }

    // Split games into batches
    const batchSize = Math.ceil(gamesWithUrls.length / BATCH_SIZE);
    const batches = chunkArray(gamesWithUrls, batchSize);

    console.log(
      `\n📦 Split ${gamesWithUrls.length} games into ${batches.length} batches (≈${batchSize} games per batch)`
    );

    // Process batches concurrently to check URLs faster
    console.log("\n🚀 Starting concurrent batch processing...");
    const allInvalidGames: Game[] = [];

    const batchResults = await Promise.all(
      batches.map((batch, index) => processBatch(batch, index))
    );

    // Flatten all invalid games from all batches
    batchResults.forEach(invalidGames => {
      allInvalidGames.push(...invalidGames);
    });

    console.log(`\n📊 URL checking complete:`);
    console.log(`  ❌ Invalid URLs found: ${allInvalidGames.length}`);
    console.log(`  ✅ Games checked: ${gamesWithUrls.length}`);

    // Move invalid games from archive to rip
    if (allInvalidGames.length > 0) {
      console.log(`\n🔄 Moving ${allInvalidGames.length} games from archive to RIP...`);

      // Remove invalid games from archive
      const invalidGameIds = new Set(allInvalidGames.map(g => g.id));
      const updatedArchiveGames = archiveGames.filter(game => !invalidGameIds.has(game.id));

      // Add invalid games to RIP
      const updatedRipGames = [...ripGames, ...allInvalidGames];

      // Write updated files
      console.log("💾 Updating archive.json...");
      const updatedArchiveContent = JSON.stringify(updatedArchiveGames, null, 2);
      fs.writeFileSync(ARCHIVE_FILE_PATH, updatedArchiveContent, "utf8");
      console.log(`✅ archive.json updated (${updatedArchiveGames.length} games remaining)`);

      console.log("💾 Updating rip.json...");
      const updatedRipContent = JSON.stringify(updatedRipGames, null, 2);
      fs.writeFileSync(RIP_FILE_PATH, updatedRipContent, "utf8");
      console.log(`✅ rip.json updated (${updatedRipGames.length} total games)`);

      console.log("\n🎉 Successfully moved games with invalid URLs to RIP");
      
      // Log moved games
      console.log("\n📋 Games moved to RIP:");
      allInvalidGames.forEach(game => {
        console.log(`  - ${game.id}: ${game.name} (${game.playUrl})`);
      });
    } else {
      console.log("\n✅ All checked URLs are valid - no games moved to RIP");
    }
  } catch (error) {
    console.error("❌ Error checking game links:", error);
    process.exit(1);
  }
}

// Run the script
checkGameLinks();