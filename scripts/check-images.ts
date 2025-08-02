import fs from "fs";
import path from "path";
import { Game } from "../src/types/game";

// Paths
const ARCHIVE_PATH = path.join(__dirname, "data/archive.json");
const IMAGES_PATH = path.join(__dirname, "../public/images/games");

// Load archive.json
const archive: Game[] = JSON.parse(fs.readFileSync(ARCHIVE_PATH, "utf-8"));

// Get all game ids from archive.json (only those with an id)
const gameIds = new Set(archive.filter((g) => g.id).map((g) => g.id));

// Get all image filenames in the images directory
const imageFiles = fs.readdirSync(IMAGES_PATH).filter((f) => f.endsWith(".jpg"));
const imageIds = new Set(imageFiles.map((f) => path.parse(f).name));

// Games missing images
const gamesMissingImages = Array.from(gameIds).filter(
  (id) => !imageIds.has(id)
);
// Images missing games
const imagesMissingGames = Array.from(imageIds).filter(
  (id) => !gameIds.has(id)
);

console.log("Games missing images:", gamesMissingImages);
console.log("Images missing games:", imagesMissingGames);

if (gamesMissingImages.length === 0 && imagesMissingGames.length === 0)
  console.log("All games and images are matched.");
