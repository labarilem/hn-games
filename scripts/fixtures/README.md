# Detection regression examples

`game-detection.json` is a fixed snapshot of 53 selected posts from the January
2025 batch in `scripts/data/new.json`. It keeps each post's original title,
description, author, and selected URL so the checks continue working after the
live batch is filtered or archived.

The expected assessments were assigned from the post text: 20 playable-game
announcements, 27 tools or other non-game projects, and 6 uncertain cases or
posts needing an actual game link. A `review` assessment deliberately leaves
the decision to a person. These are regression examples used while developing
the rules, not an independent benchmark or a claim of general accuracy.

The test suite also covers duplicate evidence, case-sensitive paths, query and
fragment routes, store app IDs, preserved anchor targets, and playable games
that mention editors or other development tools.

`genre-detection.json` preserves 29 original HN titles and descriptions from
the same batch, with manually reviewed genre expectations. It includes correct
classifications (such as RPG/adventure and incremental), corrections (Tetris
is puzzle/arcade, not typing/text/board), and insufficient evidence (Marble
Marcher's technical announcement does not establish a genre). These examples
test the shared genre rules without depending on future edits to `new.json`.
