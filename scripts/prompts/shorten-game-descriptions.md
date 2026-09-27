# Shorten game titles and descriptions

Edit the titles and descriptions in `scripts/data/new.json` to make a concise,
clear game catalog. Change only the `name` and `description` fields.

## Rules

- **Name:** Keep the game's actual title or brand. Remove subtitles, genre
  explanations, platform or technology notes, marketing claims, and introductory
  phrases when they are not part of the title. Keep the original spelling and
  capitalization where possible.
- If no distinct title is supplied, use the shortest identifying name grounded
  in the existing title or description. Do not invent a branded title or
  mistake a referenced/inspirational game for the submitted game.
- **Description:** Summarize what the player does and preserve the central
  activity, distinctive mechanic, and one useful detail such as mode, platform,
  or notable constraint when relevant.
- Aim for one or two clear sentences and no more than 35 words. Shorter is
  better when it still explains what makes the game playable or distinctive.
- Use plain, neutral language. Remove greetings, personal backstory,
  development history, technology lists, requests for feedback, and promotional
  filler unless a detail directly explains how the game works.
- Do not add facts, mechanics, platforms, modes, or claims that are not
  supported by the input. Do not turn plans or prototypes into completed
  features.
- Keep essential caveats, unusual input requirements, and limitations that
  affect whether or how someone can play. Do not include URLs; those belong in
  their own fields.
- Preserve the original language and meaning. Fix obvious encoding artifacts
  only when the intended text is unambiguous.
- Preserve negation and rule direction: if uncommon words are forbidden, do
  not rewrite that as forbidding common words. Check the summary against the
  original objective and restrictions before accepting it.
- If a description is already concise, leave it unchanged. If it is empty or
  the available text is too thin to summarize without guessing, leave it
  empty.
- Preserve every ID, record, and other field exactly.

## Output

Return valid JSON as an object keyed by string game ID. Each value must contain
`name` and `description` strings for that record. Include every input ID. Do not
add commentary or modify files. Check that titles contain only game names and
that descriptions follow the rules before applying reviewed results to
`new.json`.
