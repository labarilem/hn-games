import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  assessMetadata,
  metadataForScrape,
  type MetadataAssessment,
  type MetadataInput,
} from "./metadata";

const fixtures: {
  id: string;
  source: string;
  input: MetadataInput;
  expected: Partial<MetadataAssessment>;
}[] = JSON.parse(
  readFileSync(
    path.join(__dirname, "../fixtures/metadata-detection.json"),
    "utf8",
  ),
);
for (const fixture of fixtures) {
  test(`metadata ${fixture.id}: ${fixture.input.name} (${fixture.source})`, () => {
    const result = assessMetadata(fixture.input);
    for (const [field, expected] of Object.entries(fixture.expected)) {
      assert.deepEqual(
        result[field as keyof MetadataAssessment],
        expected,
        field,
      );
    }
  });
}

const classify = (description: string, playUrl = "https://example.com/game") =>
  assessMetadata({ name: "Test game", description, playUrl });

for (const [description, expected] of [
  ["A free game with in-app purchases.", "freemium"],
  ["A freemium puzzle game.", "freemium"],
  ["A free-to-play game with paid upgrades.", "freemium"],
  ["This game is free with no in-app purchases.", "free"],
  ["A free game. Donations welcome.", "free"],
  ["Play for free. Buy towers with gold. A hint costs an attempt.", "free"],
  ["A free demo. Buy the full version for $5.", "paid"],
  ["The full game costs $5. Includes a free trial.", "paid"],
  ["A paid game with in-app purchases.", "paid"],
  ["Access requires a subscription.", "paid"],
  ["This game is free. Optional premium subscription.", "freemium"],
  ["It's free with optional in-app purchases.", "freemium"],
  ["This is a free commercial game with ads.", "free"],
  ["A free trial is available.", null],
  ["Buy towers with gold. Purchase weapons using coins.", null],
  ["A game costs one life. Spend points to buy upgrades.", null],
  [
    "Open source with free-form input. A commercial license is available.",
    null,
  ],
  ["A game about a soldier who was overpaid.", null],
  ["We plan to make a free game with in-app purchases.", null],
  ["This game is not free.", null],
  ["Free-to-play on mobile. Buy the game on Steam.", null],
] as const) {
  test(`pricing: ${description}`, () =>
    assert.equal(classify(description).pricing, expected));
}

test("unknown metadata is distinct from pending-data compatibility defaults", () => {
  const result = classify(
    "A puzzle with three colors.",
    "https://github.com/user/game",
  );
  assert.deepEqual(result.platforms, []);
  assert.deepEqual(result.playerModes, []);
  assert.equal(result.pricing, null);
  assert.deepEqual(result.needsReview, ["platforms", "playerModes", "pricing"]);
  assert.deepEqual(metadataForScrape(result), {
    platforms: ["web"],
    playerModes: ["single"],
    pricing: "free",
  });
  assert.deepEqual(result.needsReview, ["platforms", "playerModes", "pricing"]);
});

test("ignores negated/future modes while preserving current solo play", () => {
  for (const description of [
    "A single-player game. No multiplayer.",
    "Solo mode. Multiplayer is not supported.",
    "Play alone. Multiplayer is planned.",
    "A single-player game. We plan to add multiplayer.",
    "No multiplayer, but play solo.",
  ])
    assert.deepEqual(
      classify(description).playerModes,
      ["single"],
      description,
    );
});

test("human participation rather than substrings or scoreboards establishes multiplayer", () => {
  assert.deepEqual(
    classify("Common commands with a global leaderboard and sharing results.")
      .playerModes,
    [],
  );
  assert.deepEqual(
    classify("Play against a computer. One human controls three AI agents.")
      .playerModes,
    ["single"],
  );
  assert.deepEqual(classify("A co-op game for 2-4 players.").playerModes, [
    "multi",
  ]);
  assert.deepEqual(classify("For 1–4 players.").playerModes, [
    "single",
    "multi",
  ]);
  assert.deepEqual(
    classify("Not only single-player but also multiplayer.").playerModes,
    ["single", "multi"],
  );
});

test("platforms require runtime evidence, not implementation details or references", () => {
  for (const description of [
    "A browser game built on my Mac, inspired by Game Boy games.",
    "Requires desktop Chrome. Works on Android in a browser.",
  ])
    assert.deepEqual(classify(description).platforms, ["web"], description);
  assert.deepEqual(
    classify("I debug console logs on my machine.").platforms,
    [],
  );
  assert.deepEqual(
    classify(
      "Machine learning, mechanics, browser developer console and gamepad controls.",
    ).platforms,
    [],
  );
  assert.deepEqual(
    classify("A native desktop version and browser version.").platforms,
    ["desktop", "web"],
  );
  assert.deepEqual(classify("An Android app and browser version.").platforms, [
    "web",
    "android",
  ]);
  assert.deepEqual(classify("A Game Boy ROM.").platforms, ["console"]);
  assert.deepEqual(
    classify("Available on iOS. Android is coming soon.").platforms,
    ["ios"],
  );
  assert.deepEqual(classify("For Android, but not for iOS.").platforms, [
    "android",
  ]);
});

test("matches store hosts and listing paths, not spoofed hosts or URL substrings", () => {
  assert.deepEqual(
    classify("", "https://play.google.com/store/apps/details?id=game")
      .platforms,
    ["android"],
  );
  assert.deepEqual(
    classify("", "https://apps.apple.com/us/app/game/id123").platforms,
    ["ios"],
  );
  assert.deepEqual(
    classify("A macOS game.", "https://apps.apple.com/us/app/game/id123")
      .platforms,
    ["desktop"],
  );
  for (const url of [
    "https://play.google.com.evil.test/store/apps/details?id=game",
    "https://example.com/?redirect=apps.apple.com/us/app/game/id123",
    "https://apple.com/iphone",
    "https://play.google.com/about",
    "https://github.com/android/game",
  ])
    assert.deepEqual(classify("", url).platforms, [], url);
});
