---
applyTo: "scripts/data/new.json"
---

# Copilot Rules: Game Metadata Improvement for new.json

## Overview
These rules guide the improvement of game metadata in `scripts/data/new.json` to match the quality and completeness of entries in `scripts/data/archive.json`.

## Key Principles
- Metadata should be **accurate, detailed, and consistent**
- All enum values must strictly match types defined in `src/types/game.ts`
- Information should be gathered from authoritative sources (game URLs, GitHub repos, etc.)
- Descriptions should be **concise yet informative** (1-2 sentences maximum)
- Do not use special characters if possible except for reasonable english language punctuation

---

## Field-by-Field Improvement Guidelines

### 1. **name** Field
**Current Issues:**
- Contains redundant words or descriptions
- May include subtitle or tagline that should be separate

**Improvement Rules:**
- **Remove redundancy**: If the description already explains the game type, the name shouldn't repeat it
  - ❌ Bad: "Hypersplit - Like Infinite Craft but in reverse"
  - ✅ Good: "Hypersplit"
- **Keep it concise**: Aim for 2-5 words (max 40 characters)
- **Preserve branding**: Keep exact game titles as marketed
- **Remove game mode/genre keywords**: Unless they're part of the official title
  - ❌ "A wordle-inspired maze game" → ✅ "Daily Maze"
  - ❌ "daily chess bots with unique personalities" → ✅ "PawnPush"

---

### 2. **description** Field
**Current Issues:**
- Some entries are too generic or too long
- May include author notes, development history, or personal commentary
- Missing concise problem statement and core mechanic

**Improvement Rules:**
- **Max 2 sentences, 300 characters**
- **Follow this structure**:
  1. What is the core mechanic/gameplay?
  2. What is the objective or unique twist?
- **Focus on player experience**, not development process
  - ❌ Bad: "Me and my boyfriend are making a game together in our spare time..."
  - ✅ Good: "A sokoban-style puzzle game where you navigate boxes and obstacles"
- **Remove meta-commentary**: No "we'd love feedback", "join the Discord", personal stories
- **Remove URLs and links** from description (they belong in other fields)
- **Do not use dots as punctuation** whenever possible, nor to end the description

**Reference Examples:**
- ✅ "Guess the movie that features the song" (Needledrop)
- ✅ "Play classic Blackjack 21 against the dealer with a provably fair system" (Hit21)
- ✅ "Dodge, weave and blast your way through the stars in a survival style game" (Atlas Fury)

---

### 3. **platforms** Field
**Valid Values**: `["web", "desktop", "ios", "android", "console"]`
(From `Platform` enum in `src/types/game.ts`)

**Improvement Rules:**
- **Verify each platform** by visiting `playUrl` and checking distribution method
  - Web games: Browser-playable, no installation needed
  - Desktop: Standalone applications (Windows, macOS, Linux)
  - iOS: App Store or web-based iOS support
  - Android: Google Play or web-based Android support
  - Console: Nintendo, PlayStation, Xbox, etc.
- **Use lowercase** values only
- **Remove duplication**: One entry per platform
- **Infer from URLs**:
  - `github.com` or `gitlab.com` + desktop app mention → include "desktop"
  - `itch.io`, `.vercel.app`, `.com` (domain) → usually "web"
  - `apps.apple.com` → "ios"
  - `play.google.com` → "android"

---

### 4. **playerModes** Field
**Valid Values**: `["single", "multi"]`
(From `PlayerMode` enum in `src/types/game.ts`)

**Improvement Rules:**
- **Single player**: Game playable with one person, no multiplayer features
- **Multi-player**: Supports 2+ players simultaneously (local, online, turn-based)
- **Research required**: Check game documentation or play instructions
  - Look for: PvP, co-op, online multiplayer, pass-and-play, turn-based multiplayer
- **Default to single** if unclear, but prefer accuracy over assumption

---

### 5. **genres** Field
**Valid Values** (from `GameGenre` enum in `src/types/game.ts`):
```
word, roguelike, action, adventure, puzzle, rpg, fitness, coding, strategy, 
typing, arcade, survival, platformer, sport, horror, card, simulation, 
educational, quiz, mmo, idle, incremental, shooter, memory, kids, math, 
text, stealth, music, board, tower_defense, cooperative, sandbox, driving, 
daily, geography
```

**Improvement Rules:**
- **Primary genres first**: Order by gameplay focus (most relevant first)
- **Maximum 3-4 genres** per game (exceptions for complex games)
- **Be precise**:
  - `daily` = has a "game of the day" or time-limited mechanic
  - `arcade` = fast-paced, score-based, retro feel
  - `incremental` = idle/clicker mechanics with progression
  - `quiz` = question-answer format
  - `puzzle` = logic/spatial problem-solving as core mechanic
- **Avoid over-tagging**: Remove adjacent/redundant genres
  - Don't use both `arcade` and `action` unless very distinctly both
- **Look at game title, description, and gameplay** to determine genres

---

### 6. **hnUrl** Field
**Improvement Rules:**
- **Verify format**: Must be `https://news.ycombinator.com/item?id=<id>`
- **Scrape this URL** to:
  - Validate the game exists and was discussed on HN
  - Extract `hnPoints` (upvote count) if not already present
  - Confirm game details from HN discussion
  - Find community feedback about the game
- **ID must match** the game's `id` field

---

### 7. **playUrl** Field
**Improvement Rules:**
- **Must be the official game URL**, not repo or marketing page
  - ✅ `https://zakuchess.com` (playable game)
  - ❌ `https://github.com/olivierphi/zakuchess` (repository)
- **Verify URL is accessible and game is playable**
- **Detect platform from URL**:
  - Contains `/app/` or `apps.apple.com` → iOS
  - Contains `play.google.com` → Android
  - Domain is `.com`, `.io`, `.app`, `.me`, etc. → Web
  - GitHub raw content or `file://` → Desktop
- **Scrape playUrl to**:
  - Verify game playability and current status
  - Extract additional metadata (genre tags, mechanics, visuals)
  - Confirm pricing model
  - Find platform availability info in page metadata
  - Screenshots/images for game preview

---

### 8. **pricing** Field
**Valid Values**: `"free"`, `"paid"`, `"freemium"`
(From `Pricing` enum in `src/types/game.ts`)

**Improvement Rules:**
- **free** = No cost, no in-app purchases, fully playable at zero cost
- **paid** = One-time purchase required, either upfront or mandatory
- **freemium** = Free to play with optional paid features/battle pass/cosmetics
- **Verify by**: Visiting playUrl, checking app store, or finding pricing info
- **Default to "free"** for web games without explicit pricing found, unless evidence of payment

---

### 9. **sourceCodeUrl** Field
**Improvement Rules:**
- **Only include if source code is publicly available**
  - Must be a direct link to repository (GitHub, GitLab, Codeberg, etc.)
  - Must point to the actual game source code, not just a related project
- **Verify access**: The URL should be accessible and contain actual code
- **Correct invalid values**:
  - `true` or `false` → Should be `null` (not boolean)
  - Empty string `""` → Should be `null`
- **Preferred format**: Direct repository link
  - ✅ `https://github.com/username/repo`
  - ✅ `https://gitlab.com/username/repo`
  - ✅ `https://codeberg.org/username/repo`
- **Set to `null`** if:
  - Source is not publicly available
  - Repository is private
  - No source code link could be found
- **Follow up on links**: Verify the URL in the hnUrl discussion or game website

---

## URL Scraping Instructions

When improving metadata, **scrape both hnUrl and playUrl** for comprehensive information:

### Scrape hnUrl (HN Discussion):
1. Visit the Hacker News discussion
2. Extract:
   - Exact game title from first comment/post
   - Author information
   - Community feedback about genres/mechanics
   - Development context (is it open source?)
   - Any platform mentions
   - Links to source code repositories
3. Note the submission date and points count

### Scrape playUrl (Game Website/Store):
1. Visit the playable game or game page
2. Extract:
   - Official game description/tagline
   - Screenshots and metadata
   - Platform availability (web, mobile, etc.)
   - Genre tags or category labels
   - Multiplayer features (if any)
   - Pricing model/payment options
   - Links to source code (GitHub, GitLab, etc.)
   - Author/developer information
3. Check page `<meta>` tags for:
   - `og:description` → Better description source
   - `og:image` → Game preview image
   - `og:type` → Content type

---

## Data Quality Checklist

Before considering a game entry complete, verify:

- [ ] **name**: Concise, no redundant descriptors (2-5 words)
- [ ] **description**: Max 2 sentences, 300 chars, no meta-commentary
- [ ] **platforms**: Array of valid platform values, scraped and verified
- [ ] **playerModes**: Array of valid mode values (single/multi), verified
- [ ] **genres**: 2-4 genres maximum, accurate, primary first
- [ ] **hnUrl**: Valid format, verified accessible, ID matches game id
- [ ] **playUrl**: Points to playable game, not repository
- [ ] **pricing**: One of: "free", "paid", "freemium" (verified from playUrl)
- [ ] **sourceCodeUrl**: Valid repo URL or null (not empty string/boolean)
- [ ] **author**: Matches actual developer name
- [ ] **hnPoints**: Accurate (from hnUrl scrape)
- [ ] **playUrl accessible**: Game is currently playable
- [ ] **Consistency**: Matches style and quality of archive.json entries

---

## Examples of Improvements

### Example 1: Generic Description
```json
// BEFORE
{
  "name": "A wordle-inspired maze game",
  "description": "The app randomly generates a maze in a 10x10 grid...",
  "platforms": ["web"],
  "sourceCodeUrl": null
}

// AFTER
{
  "name": "Daily Maze",
  "description": "Navigate randomly generated daily mazes and share your solution path",
  "platforms": ["web"],
  "sourceCodeUrl": null
}
```

### Example 2: Invalid Boolean sourceCodeUrl
```json
// BEFORE
{
  "sourceCodeUrl": true
}

// AFTER (find the actual URL)
{
  "sourceCodeUrl": "https://github.com/username/repo"
}
// OR if not found:
{
  "sourceCodeUrl": null
}
```

### Example 3: Over-tagged Genres
```json
// BEFORE
{
  "genres": ["puzzle", "strategy", "arcade", "action", "educational"]
}

// AFTER (keep most relevant)
{
  "genres": ["puzzle", "strategy"]
}
```

---

## Tools & References

- **Game Type Definitions**: `src/types/game.ts` (Platform, PlayerMode, Pricing, GameGenre enums)
- **Quality Reference**: `scripts/data/archive.json` (use existing entries as style guide)
- **Scraping URLs**: Use browser inspection, curl, or web scraping tools
- **Validation**: Run `npm run check-duplicates`, `npm run count`, etc.

---

## Common Pitfalls to Avoid

1. ❌ **Copying descriptions directly from HN**: Too wordy, often includes commentary
2. ❌ **Using GitHub URLs as playUrl**: Link should be to playable game
3. ❌ **Over-describing in name field**: That's what description is for
4. ❌ **Using boolean/string values for sourceCodeUrl**: Must be string URL or null
5. ❌ **Including 5+ genres**: Too many, pick the primary ones
6. ❌ **Not verifying platforms**: Assume based on URL structure, verify by visiting game
7. ❌ **Missing sourceCodeUrl when repo is public**: Always provide if available
8. ❌ **Inconsistent casing/formatting**: Match archive.json style exactly

---

## Update Process

1. **Pick a game** from new.json that needs improvement
2. **Scrape both hnUrl and playUrl** for information
3. **Update fields** according to rules above
4. **Validate**: Ensure all values match enum types
5. **Cross-check**: Compare with similar entries in archive.json
6. **Test**: Run validation scripts to ensure no errors
7. **Move to archive.json** once fully complete and validated
