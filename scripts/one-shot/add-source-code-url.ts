#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";

/**
 * One-shot script to add "sourceCodeUrl": null property to all items in archive.json
 * and populate it by checking HN API for open source indicators
 */

const ARCHIVE_FILE_PATH = path.join(__dirname, "data", "archive.json");
const HN_API_BASE = "https://hn.algolia.com/api/v1/items";
const BATCH_SIZE = 5;
const DELAY_MS = 1000; // 1 second delay between requests

interface Game {
  id: string;
  name: string;
  sourceCodeUrl: boolean | string | null;
  [key: string]: any;
}

interface HNItem {
  story_text?: string;
  text?: string;
  url?: string;
}

// Sleep utility function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Check if text contains open source indicators
function containsOpenSourceIndicators(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const indicators = ["github", "gitlab", "source", "open"];
  return indicators.some((indicator) => lowerText.includes(indicator));
}

function containsOpenSourceIndicatorsStrict(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const positiveIndicators = ["open source", "open-source", "source code"];
  const negativeIndicators = [
    "closed source",
    "not open source",
    "not open-source",
  ];
  return (
    positiveIndicators.some((indicator) => lowerText.includes(indicator)) &&
    !negativeIndicators.some((indicator) => lowerText.includes(indicator))
  );
}

// Fetch HTML content from a URL
async function fetchWebpageContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`    ❌ Failed to fetch webpage ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.log(
      `    ❌ Error fetching webpage ${url}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

// Fetch HN item data
async function fetchHNItem(game: Game): Promise<boolean | string> {
  const gameId = game.id;
  try {
    const response = await fetch(`${HN_API_BASE}/${gameId}`);
    if (!response.ok) {
      console.log(
        `  ❌ Failed to fetch data for game ${gameId}: ${response.status}`
      );
      return false;
    }

    const item: HNItem = await response.json();

    // First check if the item.url contains github
    if (
      item.url &&
      (item.url.toLowerCase().includes("github.com") ||
        item.url.toLowerCase().includes("gitlab.com"))
    ) {
      console.log(`  ✅ Game ${gameId}: GitHub URL detected - ${item.url}`);
      (game as any).osUrl = item.url;
      return true;
    }

    // Check story_text and text for open source indicators
    const storyText = item.story_text || item.text;
    if (storyText && containsOpenSourceIndicators(storyText)) {
      console.log(`  ✅ Game ${gameId}: Open source detected in story text`);
      const urls = Array.from(
        new Set(storyText.match(/https?:\/\/[^\s]+/g) || [])
      );
      const foundUrl = urls.find(
        (x) => x.includes("github.com") || x.includes("gitlab.com")
      );
      if (foundUrl) {
        (game as any).osUrl = foundUrl;
      }
      return true;
    }

    // If we have a URL but no GitHub and no indicators in text, fetch the webpage
    if (item.url) {
      console.log(
        `  🔍 Game ${gameId}: Checking webpage content at ${item.url}`
      );
      const webpageContent = await fetchWebpageContent(item.url);

      if (
        webpageContent &&
        containsOpenSourceIndicatorsStrict(webpageContent)
      ) {
        console.log(
          `  ✅ Game ${gameId}: Open source detected in webpage content`
        );
        return true;
      }
    }

    console.log(`  ❌ Game ${gameId}: No open source indicators found`);
    return false;
  } catch (error) {
    console.log(
      `  ❌ Error fetching game ${gameId}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return false;
  }
}

// Process a batch of games
async function processBatch(games: Game[], batchIndex: number): Promise<void> {
  console.log(
    `\n🔄 Processing batch ${batchIndex + 1}/${BATCH_SIZE} (${games.length} games)`
  );

  for (let i = 0; i < games.length; i++) {
    const game = games[i];

    // Skip if already processed (sourceCodeUrl is not null)
    if (game.sourceCodeUrl !== null) {
      console.log(`  ⏭️  Game ${game.id} already processed, skipping`);
      continue;
    }

    console.log(`  🔍 Checking game ${game.id} (${game.name})`);

    const result = await fetchHNItem(game);
    if (result !== false) {
      game.sourceCodeUrl = result;
    }
    // If no open source indicators found, leave as null (don't set to false)

    // Wait 1 second before next request (except for the last item)
    if (i < games.length - 1) {
      await sleep(DELAY_MS);
    }
  }
}

// Split array into chunks
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function addSourceCodeUrlProperty() {
  try {
    console.log("Reading archive.json...");

    // Read the current archive.json file
    const fileContent = fs.readFileSync(ARCHIVE_FILE_PATH, "utf8");
    const games: Game[] = JSON.parse(fileContent);

    console.log(`Found ${games.length} games in archive.json`);

    // Ensure all games have sourceCodeUrl property (initialize as null if missing)
    games.forEach((game: Game) => {
      if (!game.hasOwnProperty("sourceCodeUrl")) {
        game.sourceCodeUrl = null;
      }
    });

    // Split games into 5 batches
    const batchSize = Math.ceil(games.length / BATCH_SIZE);
    const batches = chunkArray(games, batchSize);

    console.log(
      `\n📦 Split ${games.length} games into ${batches.length} batches (≈${batchSize} games per batch)`
    );

    // Process batches concurrently
    console.log("\n🚀 Starting concurrent batch processing...");
    await Promise.all(
      batches.map((batch, index) => processBatch(batch, index))
    );

    // Count results
    const totalProcessed = games.filter(
      (game) => game.sourceCodeUrl !== null
    ).length;
    const totalWithGitHub = games.filter(
      (game) => typeof game.sourceCodeUrl === "string"
    ).length;
    const totalWithIndicators = games.filter(
      (game) => game.sourceCodeUrl === true
    ).length;
    const totalNull = games.filter(
      (game) => game.sourceCodeUrl === null
    ).length;

    console.log(`\n📊 Results:`);
    console.log(`  ✅ Games with GitHub URLs: ${totalWithGitHub}`);
    console.log(
      `  ✅ Games with open source indicators: ${totalWithIndicators}`
    );
    console.log(`  📊 Total games with source code: ${totalProcessed}`);
    console.log(`  ❌ Games without open source indicators: ${totalNull}`);

    // Write the updated data back to the file
    const updatedContent = JSON.stringify(games, null, 2);
    fs.writeFileSync(ARCHIVE_FILE_PATH, updatedContent, "utf8");

    console.log(
      "\n🎉 Successfully updated archive.json with sourceCodeUrl properties"
    );
  } catch (error) {
    console.error("❌ Error updating archive.json:", error);
    process.exit(1);
  }
}

// Run the script
addSourceCodeUrlProperty();
