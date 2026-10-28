/**
 * Server-side implementation of the local-only edit mode.
 *
 * This module is only wired into the application during `next dev`. The
 * production build aliases `@/dev/edit-server` to an inert stub (see
 * next.config.js), so filesystem writes and script spawning are not part of
 * the public deployment.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  EDITABLE_FIELDS,
  EDITABLE_FIELD_LABELS,
  EDITABLE_FIELD_LIMITS,
  EditModeError,
  type DeleteResult,
  type EditableField,
  type EditableFields,
  type UpdateResult,
} from "./edit-fields";

const ROOT = process.cwd();
const DATA_DIRECTORY = path.join(ROOT, "scripts", "data");
const DATA_FILES = ["archive.json", "new.json", "rip.json"] as const;
const TSX_CLI = path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");
const LOOPBACK_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "0.0.0.0",
]);

type GameRecord = Record<string, unknown> & { id: string };

type Collection = {
  file: (typeof DATA_FILES)[number];
  filePath: string;
  raw: string;
  games: GameRecord[];
};

let mutationQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(task, task);
  mutationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function assertDevEnvironment() {
  if (process.env.NODE_ENV !== "development")
    throw new EditModeError(
      404,
      "Edit mode is only available while running the local development server.",
    );
}

function isLoopbackHost(host: string | null): boolean {
  if (!host) return false;
  try {
    const hostname = new URL(`http://${host}`).hostname.toLowerCase();
    return LOOPBACK_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

export function isDevEditRequest(request: Request): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (!isLoopbackHost(request.headers.get("host"))) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (!isLoopbackHost(new URL(origin).host)) return false;
    } catch {
      return false;
    }
  }

  return true;
}

async function readCollections(): Promise<Collection[]> {
  return Promise.all(
    DATA_FILES.map(async (file) => {
      const filePath = path.join(DATA_DIRECTORY, file);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed))
        throw new EditModeError(500, `${file} must contain an array of games.`);
      return { file, filePath, raw, games: parsed as GameRecord[] };
    }),
  );
}

async function runTsxScript(
  script: "compile.ts" | "delete-game.ts",
  args: string[] = [],
): Promise<string> {
  try {
    await fs.access(TSX_CLI);
  } catch {
    throw new EditModeError(
      500,
      "The tsx runner is missing. Run `npm install` and try again.",
    );
  }

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [TSX_CLI, path.join(ROOT, "scripts", script), ...args],
      {
        cwd: ROOT,
        env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    function finish(error?: Error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(stdout.trim());
    }

    const timer = setTimeout(() => {
      child.kill();
      finish(new Error(`${script} timed out after 120 seconds.`));
    }, 120_000);

    child.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });
    child.on("error", (error) => {
      finish(new Error(`Could not run ${script}: ${error.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        finish();
        return;
      }
      const details = stderr.trim() || stdout.trim();
      finish(
        new Error(
          `${script} failed${code === null ? "" : ` (exit ${code})`}${
            details ? `:\n${details}` : "."
          }`,
        ),
      );
    });
  });
}

function validateHttpUrl(value: string, label: string): string {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return value;
  } catch {
    // Fall through to the shared error below.
  }
  throw new EditModeError(400, `${label} must be a valid http(s) URL.`);
}

function normalizeFields(fields: unknown): EditableFields {
  if (!fields || typeof fields !== "object" || Array.isArray(fields))
    throw new EditModeError(400, "`fields` must be an object.");

  const provided: EditableFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key === "id")
      throw new EditModeError(400, "The game ID cannot be edited.");
    if (!EDITABLE_FIELDS.includes(key as EditableField))
      throw new EditModeError(400, `Unknown field: ${key}.`);
    const field = key as EditableField;
    if (typeof value !== "string")
      throw new EditModeError(400, `${field} must be a string.`);
    if (value.length > EDITABLE_FIELD_LIMITS[field])
      throw new EditModeError(
        400,
        `${field} must be at most ${EDITABLE_FIELD_LIMITS[field]} characters.`,
      );
    provided[field] = value;
  }

  const normalized: EditableFields = {};
  for (const field of EDITABLE_FIELDS) {
    const value = provided[field];
    if (value === undefined) continue;
    const trimmed = value.trim();

    switch (field) {
      case "name":
      case "author":
        if (!trimmed)
          throw new EditModeError(
            400,
            `${EDITABLE_FIELD_LABELS[field]} cannot be empty.`,
          );
        normalized[field] = trimmed;
        break;
      case "description":
        normalized[field] = trimmed;
        break;
      case "releaseDate": {
        const date = new Date(trimmed);
        if (!trimmed || Number.isNaN(date.getTime()))
          throw new EditModeError(
            400,
            "Release date must be a valid ISO 8601 date.",
          );
        normalized[field] = date.toISOString();
        break;
      }
      case "hnUrl":
      case "playUrl":
        normalized[field] = validateHttpUrl(
          trimmed,
          EDITABLE_FIELD_LABELS[field],
        );
        break;
      case "sourceCodeUrl":
        normalized[field] = trimmed
          ? validateHttpUrl(trimmed, EDITABLE_FIELD_LABELS[field])
          : "";
        break;
      case "imageUrl":
        if (!trimmed)
          throw new EditModeError(400, "Image URL cannot be empty.");
        normalized[field] = trimmed.startsWith("/")
          ? trimmed
          : validateHttpUrl(trimmed, EDITABLE_FIELD_LABELS[field]);
        break;
    }
  }

  return normalized;
}

async function updateGameFieldsInternal(
  id: unknown,
  fields: unknown,
): Promise<UpdateResult> {
  assertDevEnvironment();

  if (typeof id !== "string" || !/^\d+$/.test(id))
    throw new EditModeError(400, "A numeric game ID is required.");

  const normalized = normalizeFields(fields);
  if (Object.keys(normalized).length === 0)
    throw new EditModeError(400, "No editable fields were provided.");

  const patch: Record<string, unknown> = { ...normalized };
  // An empty source-code URL removes the link instead of writing "".
  if (patch.sourceCodeUrl === "") patch.sourceCodeUrl = null;

  const collections = await readCollections();
  const collection = collections.find((item) =>
    item.games.some((game) => game.id === id),
  );
  if (!collection) throw new EditModeError(404, `No game found for ID ${id}.`);

  const updatedGames = collection.games.map((game) =>
    game.id === id ? { ...game, ...patch } : game,
  );
  const nextRaw = JSON.stringify(updatedGames, null, 2);

  if (nextRaw === collection.raw)
    return {
      ok: true,
      id,
      file: collection.file,
      message: "No changes to save.",
    };

  await fs.writeFile(collection.filePath, nextRaw, "utf8");
  try {
    await runTsxScript("compile.ts");
  } catch (error) {
    // Put the source data back so a failed compile cannot leave the JSON and
    // generated TypeScript files out of sync.
    await fs
      .writeFile(collection.filePath, collection.raw, "utf8")
      .catch(() => undefined);
    await runTsxScript("compile.ts").catch(() => undefined);
    throw new EditModeError(
      500,
      `The catalog could not be recompiled; the previous data was restored. ${
        error instanceof Error ? error.message : ""
      }`.trim(),
    );
  }

  return {
    ok: true,
    id,
    file: collection.file,
    message: `Saved ${id} to ${collection.file} and recompiled the catalog.`,
  };
}

export function updateGameFields(
  id: unknown,
  fields: unknown,
): Promise<UpdateResult> {
  return enqueue(() => updateGameFieldsInternal(id, fields));
}

async function deleteGamesInternal(ids: unknown): Promise<DeleteResult> {
  assertDevEnvironment();

  if (!Array.isArray(ids) || ids.length === 0)
    throw new EditModeError(400, "`ids` must be a non-empty array.");
  if (ids.length > 100)
    throw new EditModeError(400, "Select at most 100 games at a time.");

  const requested = Array.from(
    new Set(
      ids.map((id) => {
        if (typeof id !== "string" || !/^\d+$/.test(id))
          throw new EditModeError(400, "Every game ID must be numeric.");
        return id;
      }),
    ),
  );

  const collections = await readCollections();
  const existingIds = new Set(
    collections.flatMap((collection) =>
      collection.games.map((game) => game.id),
    ),
  );
  const deletedIds = requested.filter((id) => existingIds.has(id));
  const missingIds = requested.filter((id) => !existingIds.has(id));

  if (deletedIds.length === 0)
    throw new EditModeError(
      404,
      `No matching games found for: ${missingIds.join(", ")}.`,
    );

  const output = await runTsxScript("delete-game.ts", deletedIds);
  try {
    await runTsxScript("compile.ts");
  } catch (error) {
    throw new EditModeError(
      500,
      `The games were deleted, but the catalog could not be recompiled. Run \`npm run compile\` manually. ${
        error instanceof Error ? error.message : ""
      }`.trim(),
    );
  }

  const summary =
    output
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.startsWith("Deleted ")) ??
    `Deleted ${deletedIds.length} game${deletedIds.length === 1 ? "" : "s"}.`;

  return {
    ok: true,
    deletedIds,
    missingIds,
    message: summary,
  };
}

export function deleteGames(ids: unknown): Promise<DeleteResult> {
  return enqueue(() => deleteGamesInternal(ids));
}
