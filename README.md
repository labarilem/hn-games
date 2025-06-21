# hn-games

Hacker News games collection website.

## Development

Start the development server with:

```bash
npm run dev
```

## Scraping

1. Scrape new games:

   ```bash
   npm run scrape
   ```

   results are saved in `scripts/data/new.json`.

2. Manually filter the new games:

```bash
npm run filter
```

results are saved in `scripts/data/new.json`.

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

the results are saved in `scripts/data/invalid-links.json`.

## Images

Screenshots should be as close as possible to the 16:9 format to look good in the app.
You can use a 16:9 custom device in Chrome webdev tools to make it easier.

Image format must be JPEG.
PNGs can be converted with this tool: https://png2jpg.com/ (max 20 images per batch)
