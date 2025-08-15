#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";

/**
 * Script to update Hacker News points for games released in the last month
 */

const ARCHIVE_FILE_PATH = path.join(__dirname, "data", "archive.json");
const RIP_FILE_PATH = path.join(__dirname, "data", "rip.json");
const HN_API_BASE = "https://hn.algolia.com/api/v1/items";
const BATCH_SIZE = 5;
const DELAY_MS = 1000; // 1 second delay between requests

interface Game {
  id: string;
  name: string;
  releaseDate: string;
  hnPoints: number;
  [key: string]: any;
}

interface HNItem {
  points: number;
}

// Sleep utility function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Calculate date one month ago from today
function getOneMonthAgo(): Date {
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1);
  return oneMonthAgo;
}

// Check if game's release date is within the last month
function isGameInTimeInterval(game: Game, intervalStart: Date): boolean {
  const releaseDate = new Date(game.releaseDate);
  return releaseDate >= intervalStart;
}

// Fetch updated HN points for a game
async function fetchUpdatedPoints(game: Game): Promise<number | null> {
  const gameId = game.id;
  try {
    const response = await fetch(`${HN_API_BASE}/${gameId}`);
    if (!response.ok) {
      console.log(
        `  ❌ Failed to fetch data for game ${gameId}: ${response.status}`
      );
      return null;
    }

    const item: HNItem = await response.json();
    const newPoints = item.points;
    
    console.log(`  📊 Game ${gameId} (${game.name}): ${game.hnPoints} → ${newPoints} points`);
    return newPoints;
  } catch (error) {
    console.log(
      `  ❌ Error fetching game ${gameId}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

// Process a batch of games
async function processBatch(games: Game[], batchIndex: number): Promise<number> {
  console.log(
    `\n🔄 Processing batch ${batchIndex + 1}/${BATCH_SIZE} (${games.length} games)`
  );

  let updatedCount = 0;

  for (let i = 0; i < games.length; i++) {
    const game = games[i];

    console.log(`  🔍 Checking game ${game.id} (${game.name})`);

    const newPoints = await fetchUpdatedPoints(game);
    if (newPoints != null && newPoints !== game.hnPoints) {
      console.log(`  ✅ Updated points for ${game.id}: ${game.hnPoints} → ${newPoints}`);
      game.hnPoints = newPoints;
      updatedCount++;
    } else if (newPoints === game.hnPoints) {
      console.log(`  ✅ Points unchanged for ${game.id}: ${game.hnPoints}`);
    }

    // Wait 1 second before next request (except for the last item)
    if (i < games.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  return updatedCount;
}

// Split array into chunks
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function updateHNPoints() {
  try {
    const oneMonthAgo = getOneMonthAgo();
    console.log(`📅 Looking for games released after: ${oneMonthAgo.toISOString()}`);

    // Read archive.json
    console.log("📖 Reading archive.json...");
    const archiveContent = fs.readFileSync(ARCHIVE_FILE_PATH, "utf8");
    const archiveGames: Game[] = JSON.parse(archiveContent);

    // Read rip.json
    console.log("📖 Reading rip.json...");
    const ripContent = fs.readFileSync(RIP_FILE_PATH, "utf8");
    const ripGames: Game[] = JSON.parse(ripContent);

    // Filter games from the last month
    const recentArchiveGames = archiveGames.filter(game => 
      isGameInTimeInterval(game, oneMonthAgo)
    );
    const recentRipGames = ripGames.filter(game => 
      isGameInTimeInterval(game, oneMonthAgo)
    );

    const allRecentGames = [...recentArchiveGames, ...recentRipGames];

    console.log(`🎮 Found ${allRecentGames.length} games released in the last month:`);
    console.log(`  - Archive games: ${recentArchiveGames.length}`);
    console.log(`  - RIP games: ${recentRipGames.length}`);

    if (allRecentGames.length === 0) {
      console.log("ℹ️  No games found in the specified time interval. Exiting.");
      return;
    }

    // Split games into 5 batches
    const batchSize = Math.ceil(allRecentGames.length / BATCH_SIZE);
    const batches = chunkArray(allRecentGames, batchSize);

    console.log(
      `\n📦 Split ${allRecentGames.length} games into ${batches.length} batches (≈${batchSize} games per batch)`
    );

    // Process batches concurrently
    console.log("\n🚀 Starting concurrent batch processing...");
    const updateCounts = await Promise.all(
      batches.map((batch, index) => processBatch(batch, index))
    );

    const totalUpdated = updateCounts.reduce((sum, count) => sum + count, 0);

    console.log(`\n📊 Processing complete:`);
    console.log(`  ✅ Games updated: ${totalUpdated}`);
    console.log(`  📊 Games checked: ${allRecentGames.length}`);

    // Write updated data back to files if there were changes
    if (totalUpdated > 0) {
      if (recentArchiveGames.length > 0) {
        console.log("\n💾 Updating archive.json...");
        const updatedArchiveContent = JSON.stringify(archiveGames, null, 2);
        fs.writeFileSync(ARCHIVE_FILE_PATH, updatedArchiveContent, "utf8");
        console.log("✅ archive.json updated successfully");
      }

      if (recentRipGames.length > 0) {
        console.log("\n💾 Updating rip.json...");
        const updatedRipContent = JSON.stringify(ripGames, null, 2);
        fs.writeFileSync(RIP_FILE_PATH, updatedRipContent, "utf8");
        console.log("✅ rip.json updated successfully");
      }

      console.log("\n🎉 Successfully updated HN points for recent games");
    } else {
      console.log("\n ℹ️ No changes detected, files not updated");
    }
  } catch (error) {
    console.error("❌ Error updating HN points:", error);
    process.exit(1);
  }
}

// Run the script
updateHNPoints();