import { promises as fs } from "fs";
import path from "path";

const DATA_DIRECTORY = path.join(__dirname, "data");
const IMAGE_DIRECTORY = path.resolve(__dirname, "../public/images/games");
const DATA_FILES = ["archive.json", "new.json", "rip.json"] as const;

type GameRecord = {
  id: string;
  name?: string;
  imageUrl?: string;
};

function parseArguments(): { ids: string[]; dryRun: boolean } {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const values = args.filter((arg) => arg !== "--dry-run");
  const input = values[0] === "--id" ? values.slice(1) : values;
  const ids = input
    .join(" ")
    .split(/[,;\s]+/)
    .filter(Boolean);

  if (!ids.length || ids.some((id) => !/^\d+$/.test(id))) {
    throw new Error(
      "Usage: npm run delete-game -- <game-id>[,<game-id>...] [--dry-run]\n       npm run delete-game -- --id <game-id>[,<game-id>...] [--dry-run]",
    );
  }
  return { ids: Array.from(new Set(ids)), dryRun };
}

function getLocalImagePath(imageUrl: unknown): string | undefined {
  if (typeof imageUrl !== "string" || !imageUrl) return;

  try {
    const url = new URL(imageUrl, "https://hn-games.local");
    if (url.origin !== "https://hn-games.local") return;

    const decodedPath = decodeURIComponent(url.pathname);
    if (!decodedPath.startsWith("/images/games/")) return;

    const imagePath = path.resolve(
      IMAGE_DIRECTORY,
      `.${decodedPath.slice("/images/games".length).split("/").join(path.sep)}`,
    );
    const relativePath = path.relative(IMAGE_DIRECTORY, imagePath);
    if (
      !relativePath ||
      relativePath === ".." ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    )
      return;

    return imagePath;
  } catch {
    return;
  }
}

function imageKey(imagePath: string): string {
  return path.resolve(imagePath).toLowerCase();
}

async function main() {
  const { ids, dryRun } = parseArguments();
  const collections = await Promise.all(
    DATA_FILES.map(async (file) => {
      const filePath = path.join(DATA_DIRECTORY, file);
      const raw = await fs.readFile(filePath, "utf8");
      const games: GameRecord[] = JSON.parse(raw);
      if (!Array.isArray(games))
        throw new Error(`${file} must contain an array of games.`);
      return { file, filePath, raw, games };
    }),
  );

  const matches = collections.flatMap(({ file, games }) =>
    games
      .filter((game) => ids.includes(game.id))
      .map((game) => ({ file, game })),
  );
  const foundIds = new Set(matches.map(({ game }) => game.id));
  const missingIds = ids.filter((id) => !foundIds.has(id));
  if (missingIds.length) {
    throw new Error(
      `No game found for ID${missingIds.length === 1 ? "" : "s"}: ${missingIds.join(", ")}.`,
    );
  }

  const removedIds = new Set(ids);
  const remainingGames = collections.flatMap(({ games }) =>
    games.filter((game) => !removedIds.has(game.id)),
  );
  const remainingImageKeys = new Set(
    remainingGames
      .map((game) => getLocalImagePath(game.imageUrl))
      .filter((imagePath): imagePath is string => Boolean(imagePath))
      .map(imageKey),
  );

  const images = new Map<string, string>();
  for (const { game } of matches) {
    const imagePath = getLocalImagePath(game.imageUrl);
    if (imagePath) images.set(imageKey(imagePath), imagePath);
  }
  for (const id of ids) {
    const idImagePath = path.resolve(IMAGE_DIRECTORY, `${id}.jpg`);
    images.set(imageKey(idImagePath), idImagePath);
  }

  const deletableImages = Array.from(images.values()).filter(
    (imagePath) => !remainingImageKeys.has(imageKey(imagePath)),
  );
  const sharedImages = Array.from(images.values()).filter((imagePath) =>
    remainingImageKeys.has(imageKey(imagePath)),
  );

  console.log(`Games ${ids.join(", ")}:`);
  for (const id of ids) {
    const names = matches
      .filter((match) => match.game.id === id)
      .map(({ game }) => game.name ?? "(unnamed)");
    console.log(`  ${id}: ${names.join(", ")}`);
  }
  for (const { file } of collections) {
    const count = matches.filter((match) => match.file === file).length;
    if (count)
      console.log(
        `  ${file}: remove ${count} entr${count === 1 ? "y" : "ies"}`,
      );
  }
  for (const imagePath of deletableImages)
    console.log(`  image: delete ${path.relative(IMAGE_DIRECTORY, imagePath)}`);
  for (const imagePath of sharedImages)
    console.log(
      `  image: keep shared file ${path.relative(IMAGE_DIRECTORY, imagePath)}`,
    );

  if (dryRun) {
    console.log("Dry run: no files were changed.");
    return;
  }

  const imageSnapshots = new Map<string, Buffer>();
  for (const imagePath of deletableImages) {
    try {
      imageSnapshots.set(imagePath, await fs.readFile(imagePath));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  // Prepare every updated catalog before writing any of them, so invalid data
  // or an invalid target leaves all three source files untouched.
  const updates = collections
    .map(({ file, filePath, raw, games }) => ({
      file,
      filePath,
      raw,
      updated: games.filter((game) => !removedIds.has(game.id)),
    }))
    .filter(
      ({ raw, updated }) =>
        JSON.stringify(updated) !== JSON.stringify(JSON.parse(raw)),
    );

  const written: (typeof updates)[number][] = [];
  const deletedImages: string[] = [];
  try {
    for (const update of updates) {
      written.push(update);
      await fs.writeFile(
        update.filePath,
        JSON.stringify(update.updated, null, 2),
      );
    }

    for (const imagePath of deletableImages) {
      try {
        await fs.unlink(imagePath);
        deletedImages.push(imagePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
  } catch (error) {
    // Restore catalog files and images if a later deletion fails.
    await Promise.all(
      written
        .map(({ filePath, raw }) => fs.writeFile(filePath, raw))
        .concat(
          deletedImages.map((imagePath) =>
            fs.writeFile(imagePath, imageSnapshots.get(imagePath)!),
          ),
        ),
    );
    throw error;
  }

  const removedCount = matches.length;
  console.log(
    `Deleted ${removedCount} game entr${removedCount === 1 ? "y" : "ies"} and ${deletableImages.length} image file${deletableImages.length === 1 ? "" : "s"}.`,
  );
  if (sharedImages.length)
    console.log(
      "Shared image files were kept because another catalog entry still references them.",
    );
  console.log(
    "If an archived or RIP game was removed, run `npm run compile` to refresh the website data.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
