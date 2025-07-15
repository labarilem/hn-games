import fs from "fs";
import path from "path";
import { Game } from "../src/types/game";

// Paths
const ARCHIVE_PATH = path.join(__dirname, "data/archive.json");

// Load archive.json
const archive: Game[] = JSON.parse(fs.readFileSync(ARCHIVE_PATH, "utf-8"));

function getIdFromImageUrl(imageUrl: string): string | null {
  const filename = path.basename(imageUrl);
  return path.parse(filename).name;
}

function getIdFromHnUrl(hnUrl: string): string | null {
  try {
    const url = new URL(hnUrl);
    return url.searchParams.get("id");
  } catch {
    return null;
  }
}

const inconsistencies: { game: Game; issue: string }[] = [];

// Check each game for consistency
archive.forEach((game) => {
  // Check image URL consistency
  const imageId = getIdFromImageUrl(game.imageUrl);
  if (imageId !== game.id) {
    inconsistencies.push({
      game,
      issue: `Image filename ID (${imageId}) doesn't match game ID (${game.id})`,
    });
  }

  // Check HN URL consistency
  const hnId = getIdFromHnUrl(game.hnUrl);
  if (hnId !== game.id) {
    inconsistencies.push({
      game,
      issue: `HN URL ID parameter (${hnId}) doesn't match game ID (${game.id})`,
    });
  }
});

if (inconsistencies.length === 0) {
  console.log("All IDs are consistent across games, image URLs, and HN URLs.");
} else {
  console.log(`Found ${inconsistencies.length} inconsistencies:`);
  inconsistencies.forEach(({ game, issue }) => {
    console.log(`\n[Game: ${game.name}]`);
    console.log(`ID: ${game.id}`);
    console.log(`Image URL: ${game.imageUrl}`);
    console.log(`HN URL: ${game.hnUrl}`);
    console.log(`Issue: ${issue}`);
  });
}
