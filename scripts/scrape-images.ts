import { promises as fs } from "fs";
import path from "path";
import { scrapeGameImages } from "./lib/images";

async function main() {
  const args = process.argv.slice(2);
  let inputPath = path.join(__dirname, "data/new.json");
  const targetIds = new Set<string>();
  let overwrite = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--overwrite") {
      overwrite = true;
    } else if (args[i] === "--file" || args[i] === "--id") {
      const option = args[i];
      const value = args[++i];
      if (!value || value.startsWith("--"))
        throw new Error(`${option} requires a value`);
      if (option === "--file") inputPath = path.resolve(value);
      else {
        for (const id of value.split(",")) {
          if (!/^\d+$/.test(id.trim()))
            throw new Error(`Invalid game ID: ${id}`);
          targetIds.add(id.trim());
        }
      }
    } else {
      throw new Error(`Unknown option: ${args[i]}`);
    }
  }

  const json = (await fs.readFile(inputPath, "utf8")).replace(/^\uFEFF/, "");
  const data: unknown = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error("Expected a JSON array of games");
  const games = data
    .map((game) => {
      if (
        !game ||
        typeof game.id !== "string" ||
        !/^\d+$/.test(game.id) ||
        typeof game.name !== "string" ||
        typeof game.playUrl !== "string"
      )
        throw new Error(
          "Each game must have a numeric string ID, name, and playUrl",
        );
      return {
        id: game.id as string,
        name: game.name as string,
        playUrl: game.playUrl as string,
      };
    })
    .filter((game) => !targetIds.size || targetIds.has(game.id));
  const missing = Array.from(targetIds).filter(
    (id) => !games.some((game) => game.id === id),
  );
  if (missing.length)
    throw new Error(
      `Games ${missing.join(", ")} were not found in ${inputPath}`,
    );

  const results = await scrapeGameImages(games, { overwrite });
  if (results.failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
