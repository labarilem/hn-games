import { promises as fs, readFileSync } from "fs";
import path from "path";
import { Game } from "../src/types/game";

// Paths
const ARCHIVE_PATH = path.join(__dirname, "data/archive.json");
const RIP_PATH = path.join(__dirname, "data/rip.json");
const NEW_PATH = path.join(__dirname, "data/new.json");

type DuplicateReport = {
  id: string;
  name: string;
  duplicateType: "title-author" | "url";
  sourceFile: string;
  conflictsWith: Array<{
    id: string;
    name: string;
    sourceFile: string;
  }>;
};

// Normalize URLs to catch duplicates with slight variations
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash, normalize protocol and domain to lowercase
    let normalized =
      parsed.origin.toLowerCase() + parsed.pathname.toLowerCase();
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, "");
    // Preserve search params but sort them for consistency
    if (parsed.search) {
      const params = new URLSearchParams(parsed.search);
      params.sort();
      normalized += "?" + params.toString();
    }
    return normalized;
  } catch (e) {
    // If URL parsing fails, return normalized version of the string
    return url.toLowerCase().replace(/\/$/, "");
  }
}

async function checkDuplicates() {
  try {
    // Load all game files
    const archive: Game[] = JSON.parse(readFileSync(ARCHIVE_PATH, "utf-8"));
    const rip: Game[] = JSON.parse(readFileSync(RIP_PATH, "utf-8"));
    const newGames: Game[] = JSON.parse(readFileSync(NEW_PATH, "utf-8"));

    // Create indexed map for fast lookup: (title-author or url) -> list of games
    const titleAuthorIndex = new Map<
      string,
      Array<{ game: Game; file: string }>
    >();
    const urlIndex = new Map<string, Array<{ game: Game; file: string }>>();

    // Helper function to add games to indices
    const indexGames = (games: Game[], sourceFile: string) => {
      games.forEach((game) => {
        // Index by title-author pair
        const titleAuthorKey = `${game.name}|${game.author}`;
        if (!titleAuthorIndex.has(titleAuthorKey))
          titleAuthorIndex.set(titleAuthorKey, []);
        titleAuthorIndex.get(titleAuthorKey)!.push({ game, file: sourceFile });

        // Index by normalized playUrl if present
        if (game.playUrl) {
          const normalizedUrl = normalizeUrl(game.playUrl);
          if (!urlIndex.has(normalizedUrl)) urlIndex.set(normalizedUrl, []);
          urlIndex.get(normalizedUrl)!.push({ game, file: sourceFile });
        }
      });
    };

    indexGames(archive, "archive.json");
    indexGames(rip, "rip.json");
    indexGames(newGames, "new.json");

    // Find duplicates
    const duplicates: DuplicateReport[] = [];

    // Check title-author duplicates
    titleAuthorIndex.forEach((games, key) => {
      if (games.length > 1) {
        games.forEach((item, index) => {
          duplicates.push({
            id: item.game.id,
            name: item.game.name,
            duplicateType: "title-author",
            sourceFile: item.file,
            conflictsWith: games
              .filter((_, i) => i !== index)
              .map((conflict) => ({
                id: conflict.game.id,
                name: conflict.game.name,
                sourceFile: conflict.file,
              })),
          });
        });
      }
    });

    // Check URL duplicates
    urlIndex.forEach((games, url) => {
      if (games.length > 1) {
        const titleAuthorKeys = new Set(
          games.map((g) => `${g.game.name}|${g.game.author}`)
        );
        // Only report URL duplicates if they don't have matching title-author
        if (titleAuthorKeys.size > 1 || titleAuthorKeys.size === 1) {
          games.forEach((item, index) => {
            const existing = duplicates.find(
              (d) => d.id === item.game.id && d.duplicateType === "url"
            );
            if (!existing) {
              duplicates.push({
                id: item.game.id,
                name: item.game.name,
                duplicateType: "url",
                sourceFile: item.file,
                conflictsWith: games
                  .filter((_, i) => i !== index)
                  .map((conflict) => ({
                    id: conflict.game.id,
                    name: conflict.game.name,
                    sourceFile: conflict.file,
                  })),
              });
            }
          });
        }
      }
    });

    // Report results
    if (duplicates.length === 0) {
      console.log(
        "✓ No duplicates found across archive.json, rip.json, and new.json"
      );
    } else {
      console.log(`\n⚠ Found ${duplicates.length} duplicate entries:\n`);
      duplicates.forEach((dup, index) => {
        const typeLabel =
          dup.duplicateType === "title-author" ? "Title+Author" : "URL";
        console.log(
          `${index + 1}. [${dup.sourceFile}] "${dup.name}" (ID: ${dup.id})`
        );
        console.log(`   Type: ${typeLabel} duplicate`);
        dup.conflictsWith.forEach((conflict) => {
          console.log(
            `   → Conflicts with [${conflict.sourceFile}] "${conflict.name}" (ID: ${conflict.id})`
          );
        });
        console.log();
      });
    }

    // Summary stats
    console.log(`\nSummary:`);
    console.log(`  archive.json: ${archive.length} games`);
    console.log(`  rip.json: ${rip.length} games`);
    console.log(`  new.json: ${newGames.length} games`);
    console.log(
      `  Total: ${archive.length + rip.length + newGames.length} games`
    );
    console.log(`  Duplicates: ${duplicates.length}`);
  } catch (error) {
    console.error("Error checking duplicates:", error);
    process.exit(1);
  }
}

checkDuplicates();
