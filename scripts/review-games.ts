import { promises as fs } from "fs";
import path from "path";
import { findDuplicates, type DuplicateGame } from "./lib/duplicates";
import { assessGame, candidateGameUrls } from "./lib/game-detection";
import { determineGenres } from "./lib/genres";
import { assessMetadata } from "./lib/metadata";

async function main() {
  const collections = await Promise.all(
    ["new.json", "archive.json", "rip.json"].map(async (source) => {
      const games: DuplicateGame[] = JSON.parse(
        await fs.readFile(path.join(__dirname, "data", source), "utf8"),
      );
      return games.map((game) => ({ game, source }));
    }),
  );
  const duplicates = findDuplicates(collections.flat()).filter(
    (match) =>
      match.left.source === "new.json" || match.right.source === "new.json",
  );
  const assessments = collections[0].map(({ game }) => {
    const assessment = assessGame(game);
    const suggestedUrl = candidateGameUrls(
      game.playUrl,
      game.description ?? "",
    )[0];
    return {
      id: game.id,
      name: game.name,
      playUrl: game.playUrl,
      ...assessment,
      suggestedGenres: determineGenres(game.name, game.description),
      suggestedMetadata: assessMetadata(game),
      suggestedUrl:
        suggestedUrl && suggestedUrl !== game.playUrl
          ? suggestedUrl
          : undefined,
    };
  });
  const summary = {
    total: assessments.length,
    likelyGames: assessments.filter((item) => item.verdict === "likely-game")
      .length,
    nonGames: assessments.filter((item) => item.verdict === "not-game").length,
    needsReview: assessments.filter((item) => item.verdict === "review").length,
    duplicatePairs: duplicates.length,
    metadataNeedsReview: assessments.filter(
      (item) => item.suggestedMetadata.needsReview.length > 0,
    ).length,
  };
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ summary, assessments, duplicates }, null, 2));
    return;
  }
  for (const item of assessments.filter(
    (item) => item.verdict !== "likely-game",
  )) {
    console.log(
      `\n[${item.verdict}] ${item.id}: ${item.name}\n  ${item.reasons.join("; ")}\n  ${item.playUrl}`,
    );
  }
  for (const match of duplicates) {
    console.log(
      `\n[${match.confidence} duplicate] ${match.reasons.join("; ")}`,
    );
    for (const entry of [match.left, match.right])
      console.log(`  [${entry.source}] ${entry.game.id}: ${entry.game.name}`);
  }
  console.log(
    `\n${summary.total} posts: ${summary.likelyGames} likely games, ${summary.nonGames} likely non-games, ${summary.needsReview} need review; ${summary.duplicatePairs} duplicate pairs.`,
  );
  console.log(
    `${summary.metadataNeedsReview} posts have metadata without explicit text evidence; use --json for suggestions and evidence.`,
  );
  console.log(
    "Heuristic review only; no JSON data or images were changed. Use npm run filter to make decisions.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
