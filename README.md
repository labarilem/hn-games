# hn-games

Hacker News Games website and data. Live at https://hn-games.marcolabarile.me/

## Development

Start the development server with:

```bash
npm run dev
```

## Scraping

1. Scrape new games based on time range checkpoints:

   ```bash
   npm run scrape
   ```

   or scrape a single game by id:

   ```bash
   npm run scrape-single -- --id XXXXXXXX
   ```

Results are saved in `scripts/data/new.json`.

The scraper uses title and description evidence to exclude clear tools and
other non-game projects. Uncertain posts remain for manual review. Existing
HN IDs in the archive or RIP collection are skipped; URL and similar-text
duplicate matches are flagged for review. `scripts/data/scrape-review.json`
records the assessments, rejected stories, selected links, and duplicate pairs.

Review the current batch without changing data or images:

```bash
npm run review-games
```

Use `npm run review-games -- --json` for the full report, including likely
games. Assessments are heuristics, not confirmation that a game is playable.

Genre suggestions come from `scripts/lib/genres.ts`, shared by scraping,
filtering, and the JSON review report. It recognizes game mechanics and genre
phrases rather than substrings: keyboard controls do not imply `board`,
soundtrack mentions do not imply `music`, and `common` does not imply `mmo`.
Unknown genres stay empty for manual review instead of defaulting to `action`.
The regression suite includes 29 original posts from the pending batch.

Platforms, player modes, and pricing use `scripts/lib/metadata.ts`, shared by
scraping, filtering, and the JSON review report. It recognizes native/store
platform evidence, solo plus multiplayer support, and free/paid/freemium
pricing, while ignoring negated or planned features and incidental substrings.
Desktop browser requirements do not imply a native desktop version; mobile
browsers do not imply native phone apps. Store URLs establish distribution,
not pricing. Open-source licenses and in-game currency do not establish price.

Suggestions include evidence and `needsReview` fields. Missing evidence yields
empty platform/mode suggestions or null pricing. For compatibility with the
pending-data schema, scraping still writes provisional `web`, `single`, and
`free` defaults for unresolved fields, explicitly flagged in
`scripts/data/scrape-review.json`. Check these before archiving. Shortened
descriptions may omit facts confirmed during manual review, so suggestions
do not automatically replace existing metadata. The detection tests include
original posts and reviewed descriptions from the current batch plus pricing,
negation, and platform edge cases.

For LLM-assisted review and description editing, use these reusable prompts:

- [Find duplicates missed by the script](scripts/prompts/find-missed-duplicates.md)
- [Find non-games missed by the script](scripts/prompts/find-missed-non-games.md)
- [Remove unreleased and untrusted desktop-only games](scripts/prompts/review-playability-and-desktop-safety.md)
- [Shorten game titles and descriptions](scripts/prompts/shorten-game-descriptions.md)
- [Classify genres, platforms, player modes, and pricing](scripts/prompts/classify-game-metadata.md)

Give the LLM repository access, or supply the data files and current script
output requested in each prompt. The review prompts produce evidence and
cleanup recommendations for manual review. The title and description prompt
returns concise replacements for review before applying them to `new.json`.
The metadata prompt returns proposals and confidence/evidence per field;
unresolved null values are report-only and must not be written into game data.

2. Manually filter the new games:

   ```bash
   npm run filter
   ```

Results are saved in `scripts/data/new.json`. Review the remaining games, then
capture their images before archiving them (see Images below).

The filter shows classification reasons, the play URL, a description preview,
and duplicate matches before each decision. Discarded games' JPEGs are removed
after saving, unless the same ID is still kept or exists in the archive or RIP
collection. Only Y, N, or Enter are accepted so a typo cannot discard a game.

To remove reviewed games by Hacker News ID from `new.json`, `archive.json`,
and `rip.json`, along with their unshared local images, pass one or more IDs.
Separate IDs with commas, spaces, tabs, or newlines:

```bash
npm run delete-game -- 42877155
npm run delete-game -- 42877155,42694202
```

Use `npm run delete-game -- 42877155,42694202 --dry-run` to preview the affected
entries and files. An image used by a different game is kept. If any ID was
archived or in the RIP collection, run `npm run compile` afterward to refresh
the site.

3. Review those items to check if they are valid games. Then add metadata to the valid games.

4. Archive the new games:

   ```bash
   npm run archive
   ```

   the items in `scripts/data/new.json` are validated (missing metadata checks) then moved to `scripts/data/archive.json`.

5. Compile the JSON data to `src/data/games.ts`:

   ```bash
   npm run compile
   ```

## Link checking

Check all links:

```bash
npm run check-links
```

Only games with explicit dead-page responses on two checks are moved to RIP.
These include HTTP 404/410, clear page-not-found titles, and recognized parked pages.

Use `npm run check-links -- --dry-run` to preview the results. Scraping and
link checking share a validator that follows HTTP redirects, HTML meta refresh,
HTTP Refresh headers (including empty redirect pages), and simple literal
JavaScript redirects. Temporary server/network failures are retried. Timeouts,
DNS failures, certificate errors, redirect loops, empty pages, and blocked or
rate-limited responses remain **inconclusive** and are kept in the archive for
review. Recognized bot challenge pages are also inconclusive, even with HTTP 200.
The summary separates alive, confirmed dead, and inconclusive results.
Dynamic JavaScript redirects and game functionality are not evaluated by this
HTTP check; an alive result means the page was reachable, not that gameplay works.

Check specific archived games with `npm run check-links -- --dry-run --id 123,456`.

Screenshot capture uses the same parked/error-page checks after rendering.
Run `npm run test:links` for the local link-validation regression tests.

## Revive games

Move a game from RIP back to the archive when it was moved by mistake:

```bash
npm run revive -- <game-id>
```

Then recompile the site data:

```bash
npm run compile
```

Use `--dry-run` to preview without writing changes.

## Images

After filtering and reviewing games in `scripts/data/new.json`, install the
browser once:

```bash
npm run setup-images
```

Then capture images for the reviewed games before archiving:

```bash
npm run scrape-images
```

This command uses headless Chromium to capture each game's play URL at 1280×720
(16:9), waits three seconds for rendering, and saves a compressed JPEG. These
files work with the existing archive validation, cards, and game detail pages.

You can also backfill missing images in the archive, or deliberately replace
one image:

```bash
npm run scrape-images -- --file scripts/data/archive.json
npm run scrape-images -- --file scripts/data/archive.json --id XXXXXXXX --overwrite
```

The image-only command does not change game metadata. Images use the existing
`/images/games/<id>.jpg` URLs. Failed pages are reported and the remaining games
continue; failures produce a nonzero exit status. Games without an image stay
pending during archiving until you retry or supply a JPEG manually.

Review captures before archiving: loading screens, consent dialogs, or login
pages may need a manual screenshot. Keep replacement images close to 16:9 and
below 200 kB. Automatic captures retry at lower quality above 200 kB and warn
if further optimization is needed.

Run the local browser integration checks with `npm run test:images` after
installing Chromium.

## Images checking

Check all games have an image and viceversa:

```bash
npm run check-images
```

## Ids checking

Check ids consistency with other game props like hnUrl and imageUrl:

```bash
npm run check-ids
```

## Update points

Update points of HN posts submitted in the last month:

```bash
npm run update-points
```

### Check for duplicates

Check for duplicates across archive.json, rip.json and new.json:

```bash
npm run check-duplicates
```

Matches include HN IDs, normalized URLs, normalized titles with the same
author, and similar titles or descriptions from the same author. Each pair is
reported once with all matching reasons. HTTP/HTTPS, `www`, tracking parameters,
and store locale variants are normalized for comparison. Path case, game
query parameters, and fragments are preserved to avoid merging distinct games.
Similar-text matches are marked `possible`; all matches need manual review.

Run detection regression checks with:

```bash
npm run test:detection
```

## Sort games

Sort games in archive and RIP collections:

```bash
npm run sort
```

## Replace games

Replace a source game's data with a destination game's data:

```bash
npm run replace
```

## Count games

Count games in all collections:

```bash
npm run count
```

## Licenses

Source code license: `CODE_LICENSE.txt`

Data (eg. JSON and images) license: `DATA_LICENSE.txt`
