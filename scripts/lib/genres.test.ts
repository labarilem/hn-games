import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { GameGenre } from "../../src/types/game";
import { determineGenres } from "./genres";

const fixtures: {
  id: string;
  name: string;
  description: string;
  expected: GameGenre[];
}[] = JSON.parse(
  readFileSync(
    path.join(__dirname, "../fixtures/genre-detection.json"),
    "utf8",
  ),
);
for (const game of fixtures) {
  test(`genre regression ${game.id}: ${game.name}`, () => {
    assert.deepEqual(
      determineGenres(game.name, game.description),
      game.expected,
    );
  });
}

test("does not classify implementation details, fragments, or references as genres", () => {
  assert.deepEqual(
    determineGenres(
      "A new game",
      "Keyboard input and text boxes are common. The soundtrack has music. Dumping memory helped debug interaction and card styling. I learned Rust while coding it.",
    ),
    [],
  );
  assert.deepEqual(
    determineGenres(
      "An automation game inspired by Factorio, Bomberman and Lemmings",
    ),
    [GameGenre.STRATEGY],
  );
  assert.deepEqual(determineGenres("Unknown project"), []);
  assert.deepEqual(determineGenres("A multiplayer game"), []);
  assert.deepEqual(determineGenres("An MMO game"), [GameGenre.MMO]);
});

test("recognizes gameplay phrases and hyphenated genre names", () => {
  assert.deepEqual(determineGenres("A tower-defense clicker game"), [
    GameGenre.STRATEGY,
    GameGenre.INCREMENTAL,
    GameGenre.TOWER_DEFENSE,
  ]);
  assert.deepEqual(determineGenres("A music game"), [GameGenre.MUSIC]);
  assert.deepEqual(determineGenres("A memory game"), [GameGenre.MEMORY]);
  assert.deepEqual(determineGenres("A board game"), [GameGenre.BOARD]);
  assert.deepEqual(determineGenres("Daily Sudoku puzzle"), [
    GameGenre.PUZZLE,
    GameGenre.DAILY,
  ]);
});
