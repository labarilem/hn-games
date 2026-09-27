import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  duplicateUrlKey,
  findDuplicates,
  type DuplicateGame,
  type GameEntry,
} from "./duplicates";
import {
  assessGame,
  candidateGameUrls,
  type GameAssessment,
} from "./game-detection";

const fixtures: (DuplicateGame & { expected: GameAssessment["verdict"] })[] =
  JSON.parse(
    readFileSync(
      path.join(__dirname, "../fixtures/game-detection.json"),
      "utf8",
    ),
  );

for (const game of fixtures) {
  test(`scraped post ${game.id}: ${game.name}`, () => {
    assert.equal(assessGame(game).verdict, game.expected);
  });
}

test("game titles are not rejected for old blacklist substrings or developer context", () => {
  for (const name of [
    "A football game",
    "A racing game with a difficult course",
    "A puzzle game with a level editor",
    "My game has new gameplay",
    "A game where you serialize Lua data",
    "A strategy game built with my own game engine",
  ])
    assert.notEqual(assessGame({ name }).verdict, "not-game", name);
  assert.equal(
    assessGame({ name: "I built a game engine" }).verdict,
    "not-game",
  );
});

test("a reachable-looking URL, a game-like hostname, and incidental mentions are not game evidence", () => {
  assert.equal(
    assessGame({
      name: "An analytics dashboard",
      description: "Inspired by my favorite video game",
      playUrl: "https://play.example.com",
    }).verdict,
    "review",
  );
  assert.equal(
    assessGame({
      name: "Open source app",
      description: "A game changer for your work",
    }).verdict,
    "review",
  );
});

test("URL comparison handles variants but preserves game identity", () => {
  assert.equal(
    duplicateUrlKey("http://www.example.com/Play/?utm_source=hn&b=2&a=1"),
    duplicateUrlKey("https://example.com/Play?a=1&b=2"),
  );
  for (const pair of [
    ["https://example.com/Game", "https://example.com/game"],
    ["https://example.com/?game=1", "https://example.com/?game=2"],
    ["https://example.com/#/one", "https://example.com/#/two"],
    ["https://example.com/a", "https://example.com/b"],
    ["https://alice.itch.io/game", "https://bob.itch.io/game"],
  ])
    assert.notEqual(duplicateUrlKey(pair[0]), duplicateUrlKey(pair[1]));
  assert.equal(duplicateUrlKey("bad url"), null);
});

test("store URLs match by app identity across locales without merging different apps", () => {
  assert.equal(
    duplicateUrlKey("https://apps.apple.com/us/app/old-name/id123"),
    duplicateUrlKey("https://apps.apple.com/it/app/new-name/id123"),
  );
  assert.equal(
    duplicateUrlKey(
      "https://play.google.com/store/apps/details?id=foo&hl=en&gl=US",
    ),
    duplicateUrlKey("https://play.google.com/store/apps/details?id=foo&hl=it"),
  );
  assert.notEqual(
    duplicateUrlKey("https://play.google.com/store/apps/details?id=foo"),
    duplicateUrlKey("https://play.google.com/store/apps/details?id=bar"),
  );
});

function entry(
  id: string,
  overrides: Partial<DuplicateGame> = {},
  source = "new.json",
): GameEntry {
  return {
    source,
    game: {
      id,
      name: `Game ${id}`,
      author: "maker",
      playUrl: `https://example.com/${id}`,
      ...overrides,
    },
  };
}

test("duplicate evidence is combined once per pair, including the same HN ID across files", () => {
  const a = entry("1", { name: "Show HN: My Game" }, "archive.json");
  const b = entry("1", { name: "my-game", author: "MAKER" });
  const matches = findDuplicates([a, b]);
  assert.equal(matches.length, 1);
  assert.deepEqual(matches[0].reasons, [
    "same HN ID",
    "same game URL",
    "same title and author",
  ]);
  assert.equal(
    findDuplicates([
      entry("1"),
      entry("1", {
        name: "Renamed",
        author: "other",
        playUrl: "https://elsewhere.test",
      }),
    ]).length,
    1,
  );
});

test("similar descriptions identify the text adventure repost despite a different URL", () => {
  const games = fixtures.filter((game) =>
    ["42840109", "42840668"].includes(game.id),
  );
  assert.equal(games.length, 2);
  const matches = findDuplicates(
    games.map((game) => ({ game, source: "new.json" })),
  );
  assert.equal(matches.length, 1);
  assert.equal(matches[0].confidence, "possible");
  assert.ok(
    matches[0].reasons.includes(
      "near-identical description by the same author",
    ),
  );
  assert.equal(
    findDuplicates([
      entry("1", { name: "A daily word guessing game", author: "a" }),
      entry("2", { name: "A daily word guessing game", author: "b" }),
    ]).length,
    0,
  );
});

test("link selection prefers explicit play links and retains complete HTML targets", () => {
  const urls = candidateGameUrls(
    "https://github.com/author/sudoku",
    'Play the actual game on my site at <a href="https://example.com/sudoku?level=2&amp;mode=fun#/play">example.com/sud...</a>. Code: https://github.com/author/sudoku',
  );
  assert.equal(urls[0], "https://example.com/sudoku?level=2&mode=fun#/play");
  assert.ok(urls.includes("https://github.com/author/sudoku"));
});

test("link selection excludes HN and video references but allows source and PDF games", () => {
  assert.deepEqual(
    candidateGameUrls(
      "https://news.ycombinator.com/item?id=1)",
      "Demo: https://youtu.be/abc",
    ),
    [],
  );
  assert.deepEqual(candidateGameUrls("https://example.com/game.pdf", ""), [
    "https://example.com/game.pdf",
  ]);
  assert.deepEqual(candidateGameUrls("https://github.com/author/game", ""), [
    "https://github.com/author/game",
  ]);
  assert.deepEqual(
    candidateGameUrls(undefined, "Play here: https://example.com/game)"),
    ["https://example.com/game"],
  );
});
