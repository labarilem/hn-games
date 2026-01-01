/**
 * This script replaces a game submission reference with another reference.
 * It updates the destination game with id, hnUrl, hnPoints, and imageUrl from the source game.
 * It also renames the image file to match the new imageUrl.
 */

import fs from "fs";
import path from "path";
import readline from "readline/promises";
import { Game } from "../src/types/game";

const DATA_DIR = path.join(__dirname, "data");
const IMAGES_PATH = path.join(__dirname, "../public/images/games");

const DATA_FILES = {
  archive: path.join(DATA_DIR, "archive.json"),
  new: path.join(DATA_DIR, "new.json"),
  rip: path.join(DATA_DIR, "rip.json"),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getSourceFiles(): string[] {
  return Object.keys(DATA_FILES);
}

function loadGames(source: string): Game[] {
  const filePath = DATA_FILES[source as keyof typeof DATA_FILES];
  if (!filePath) {
    throw new Error(`Unknown source: ${source}`);
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

function saveGames(destination: string, games: Game[]): void {
  const filePath = DATA_FILES[destination as keyof typeof DATA_FILES];
  if (!filePath) {
    throw new Error(`Unknown destination: ${destination}`);
  }
  fs.writeFileSync(filePath, JSON.stringify(games, null, 2));
}

function findGameById(games: Game[], id: string): Game | undefined {
  return games.find((game) => game.id === id);
}

function renameImageFile(oldId: string, newId: string): void {
  const oldImagePath = path.join(IMAGES_PATH, `${oldId}.jpg`);
  const newImagePath = path.join(IMAGES_PATH, `${newId}.jpg`);

  if (!fs.existsSync(oldImagePath)) {
    console.warn(`Warning: Image file not found at ${oldImagePath}`);
    return;
  }

  if (fs.existsSync(newImagePath)) {
    console.warn(
      `Warning: Destination image file already exists at ${newImagePath}`
    );
    return;
  }

  fs.copyFileSync(oldImagePath, newImagePath);
  console.log(`✓ Image copied: ${oldId}.jpg -> ${newId}.jpg`);
}

async function main() {
  try {
    console.log("\n=== Game Submission Reference Replacement ===\n");

    // Step 1: Select source
    const sourceOptions = getSourceFiles();
    console.log(`Select source (${sourceOptions.join(", ")}):`);
    const source = (await rl.question("Source: ")).trim().toLowerCase();

    if (!sourceOptions.includes(source)) {
      console.error(`Invalid source: ${source}`);
      rl.close();
      process.exit(1);
    }

    // Step 2: Enter source game ID
    const sourceGameId = (await rl.question("Source game id: ")).trim();
    const sourceGames = loadGames(source);
    const sourceGame = findGameById(sourceGames, sourceGameId);

    if (!sourceGame) {
      console.error(`Game not found in ${source}: ${sourceGameId}`);
      rl.close();
      process.exit(1);
    }

    console.log(`✓ Found source game: ${sourceGame.name}`);
    console.log(`  - ID: ${sourceGame.id}`);
    console.log(`  - HN URL: ${sourceGame.hnUrl}`);
    console.log(`  - HN Points: ${sourceGame.hnPoints}`);
    console.log(`  - Image URL: ${sourceGame.imageUrl}\n`);

    // Step 3: Select destination
    const destinationOptions = getSourceFiles();
    console.log(`Select destination (${destinationOptions.join(", ")}):`);
    const destination = (await rl.question("Destination: "))
      .trim()
      .toLowerCase();

    if (!destinationOptions.includes(destination)) {
      console.error(`Invalid destination: ${destination}`);
      rl.close();
      process.exit(1);
    }

    // Step 4: Enter destination game ID
    const destinationGameId = (
      await rl.question("Destination game id: ")
    ).trim();
    const destinationGames = loadGames(destination);
    const destinationGameIndex = destinationGames.findIndex(
      (game) => game.id === destinationGameId
    );

    if (destinationGameIndex === -1) {
      console.error(`Game not found in ${destination}: ${destinationGameId}`);
      rl.close();
      process.exit(1);
    }

    const destinationGame = destinationGames[destinationGameIndex];
    console.log(`✓ Found destination game: ${destinationGame.name}\n`);

    // Step 5: Confirm replacement
    console.log("=== Replacement Details ===");
    console.log(`Destination game will be updated:`);
    console.log(`  - ID: ${destinationGame.id} -> ${sourceGame.id}`);
    console.log(`  - HN URL: ${destinationGame.hnUrl} -> ${sourceGame.hnUrl}`);
    console.log(
      `  - HN Points: ${destinationGame.hnPoints} -> ${sourceGame.hnPoints}`
    );
    console.log(
      `  - Image URL: ${destinationGame.imageUrl} -> ${sourceGame.imageUrl}`
    );
    console.log(
      `  - Image file will be renamed: ${destinationGameId}.jpg -> ${sourceGameId}.jpg\n`
    );

    const confirm = (await rl.question("Proceed? [y/N]: "))
      .trim()
      .toLowerCase();

    if (confirm !== "y") {
      console.log("Cancelled.");
      rl.close();
      process.exit(0);
    }

    // Step 6: Perform replacement
    destinationGame.id = sourceGame.id;
    destinationGame.hnUrl = sourceGame.hnUrl;
    destinationGame.hnPoints = sourceGame.hnPoints;
    destinationGame.imageUrl = sourceGame.imageUrl;

    // Update the array with the modified game
    destinationGames[destinationGameIndex] = destinationGame;

    // Save the updated games
    saveGames(destination, destinationGames);
    console.log(`✓ Updated ${destination}.json`);

    // Rename the image file
    renameImageFile(destinationGameId, sourceGameId);

    // Remove source game from source collection
    const sourceGameIndex = sourceGames.findIndex(
      (game) => game.id === sourceGameId
    );
    if (sourceGameIndex !== -1) {
      sourceGames.splice(sourceGameIndex, 1);
      saveGames(source, sourceGames);
      console.log(`✓ Removed source game from ${source}.json`);
    }

    console.log("\n✓ Replacement complete!\n");
    rl.close();
  } catch (error) {
    console.error("Error:", error);
    rl.close();
    process.exit(1);
  }
}

main();
