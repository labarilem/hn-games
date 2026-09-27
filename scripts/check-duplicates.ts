import { promises as fs } from "fs";
import path from "path";
import { findDuplicates, type DuplicateGame } from "./lib/duplicates";

async function checkDuplicates() {
  const files = ["archive.json", "rip.json", "new.json"];
  const collections = await Promise.all(
    files.map(async (source) => {
      const games: DuplicateGame[] = JSON.parse(
        await fs.readFile(path.join(__dirname, "data", source), "utf8"),
      );
      return { source, games };
    }),
  );
  const entries = collections.flatMap(({ source, games }) =>
    games.map((game) => ({ game, source })),
  );
  const duplicates = findDuplicates(entries);
  for (const match of duplicates) {
    console.log(`\n[${match.confidence}] ${match.reasons.join("; ")}`);
    for (const entry of [match.left, match.right]) {
      console.log(`  [${entry.source}] ${entry.game.id}: ${entry.game.name}`);
      console.log(`    ${entry.game.playUrl}`);
    }
  }
  console.log(
    `\n${duplicates.length} duplicate pairs (each pair reported once).`,
  );
  for (const { source, games } of collections)
    console.log(`${source}: ${games.length} games`);
  console.log("Matches are suggestions for review; no games were changed.");
}

checkDuplicates().catch((error) => {
  console.error("Error checking duplicates:", error);
  process.exitCode = 1;
});
