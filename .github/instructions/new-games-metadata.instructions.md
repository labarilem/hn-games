---
applyTo: "scripts/data/new.json"
---

# Game Metadata Rules for new.json

The canonical rules for improving game metadata in `scripts/data/new.json` now
live in a tool-neutral location so every assistant reads the same source:

**`/.claude/rules/new-games-metadata.md`**

That file is automatically loaded when `scripts/data/new.json` is edited, and it
covers:

- Field-by-field rules for `name`, `description`, `platforms`, `playerModes`,
  `genres`, `hnUrl`, `playUrl`, `pricing`, `sourceCodeUrl`, and `author`
- The valid enum values from `src/types/game.ts`
- Evidence-gathering rules for the play URL and HN submission
- A quality checklist, worked examples, and common pitfalls
- Validation via `npm run lint-new-games`

## How the source-of-truth files fit together

| File | Purpose |
| --- | --- |
| `.claude/rules/new-games-metadata.md` | **Canonical rules** — edit this one |
| `src/types/game.ts` | Enum definitions the rules refer to |
| `.vscode/game-schema.json` | Enforced limits, also drives VS Code validation |
| `scripts/data/archive.json` | Style reference for finished entries |

Do not duplicate the rules back into this file. Update the rule file instead so
there is a single source of truth.
