/**
 * This script reads a JSON file containing a list of games and prompts the user to keep or discard each game.
 * The filtered games are saved back to the same file.
 */

import * as fs from "fs/promises";
import path from "path";
import readline from "readline/promises";
import { assessGame } from "./lib/game-detection";
import { determineGenres } from "./lib/genres";
import { assessMetadata } from "./lib/metadata";
import { findDuplicates, type DuplicateGame } from "./lib/duplicates";

const IMAGES_PATH = path.join(__dirname, "../public/images/games");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function filterGames(jsonPath: string) {
  try {
    // Read and parse the JSON file
    const data = await fs.readFile(jsonPath, "utf8");
    const games: DuplicateGame[] = JSON.parse(data);
    const existing = (
      await Promise.all(
        ["archive.json", "rip.json"].map(async (source) => {
          const catalog: DuplicateGame[] = JSON.parse(
            await fs.readFile(path.join(__dirname, "data", source), "utf8"),
          );
          return catalog.map((game) => ({ game, source }));
        }),
      )
    ).flat();
    const duplicates = findDuplicates([
      ...existing,
      ...games.map((game) => ({ game, source: "new.json" })),
    ]);

    // Track games to keep
    const keptGames = [];
    const discardedGames = [];
    const totalGames = games.length;

    console.log(
      `\nReviewing ${totalGames} games. Press Y to keep (default), N to discard, or Ctrl+C to exit.\n`,
    );

    // Process each game sequentially using async/await
    for (let i = 0; i < games.length; i++) {
      const game = games[i];

      // Display progress and title
      process.stdout.write(`[${i + 1}/${totalGames}] ${game.name}\n`);
      const assessment = assessGame(game);
      console.log(`  ${game.playUrl}`);
      console.log(`  ${assessment.verdict}: ${assessment.reasons.join("; ")}`);
      const genres = determineGenres(game.name, game.description);
      console.log(
        `  Suggested genres: ${genres.length ? genres.join(", ") : "unclear; review manually"}`,
      );
      const metadata = assessMetadata(game);
      console.log(
        `  Suggested platforms: ${metadata.platforms.join(", ") || "unknown"}; player modes: ${metadata.playerModes.join(", ") || "unknown"}; pricing: ${metadata.pricing ?? "unknown"}`,
      );
      if (metadata.needsReview.length)
        console.log(
          `  Metadata needs evidence: ${metadata.needsReview.join(", ")}`,
        );
      if (game.description) console.log(`  ${game.description.slice(0, 400)}`);
      for (const match of duplicates.filter(
        (match) => match.left.game === game || match.right.game === game,
      )) {
        const other = match.left.game === game ? match.right : match.left;
        console.log(
          `  ${match.confidence} duplicate: [${other.source}] ${other.game.id} ${other.game.name} (${match.reasons.join("; ")})`,
        );
      }

      // Get user input
      let answer: string;
      do {
        answer = (await rl.question("Keep this game? [Y/n]: "))
          .trim()
          .toLowerCase();
        if (!["", "y", "n"].includes(answer))
          console.log("Please enter Y or N.");
      } while (!["", "y", "n"].includes(answer));

      // Keep game if response is Y or empty
      if (answer === "" || answer === "y") {
        keptGames.push(game);
        console.log("✓ Kept\n");
      } else {
        discardedGames.push(game);
        console.log("✗ Discarded\n");
      }
    }

    // Save filtered games back to file
    await fs.writeFile(jsonPath, JSON.stringify(keptGames, null, 2));
    console.log(`\nSaved ${keptGames.length} games to ${jsonPath}`);

    // Remove matching local images only after saving the filter results.
    const retainedIds = new Set([
      ...keptGames.map((game) => game.id),
      ...existing.map(({ game }) => game.id),
    ]);
    let deletedImages = 0;
    for (const game of discardedGames) {
      if (retainedIds.has(game.id)) continue;
      if (typeof game.id !== "string" || !/^\d+$/.test(game.id)) continue;
      try {
        await fs.unlink(path.join(IMAGES_PATH, `${game.id}.jpg`));
        deletedImages++;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    console.log(
      `Deleted ${deletedImages} image${deletedImages === 1 ? "" : "s"} for discarded games.`,
    );

    rl.close();
  } catch (error) {
    console.error("Error:", error);
    rl.close();
    process.exit(1);
  }
}

// Run the script with the JSON file path
filterGames("scripts/data/new.json");
