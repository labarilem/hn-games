# hn-games

Hacker News Games website and data.

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

Images can be made 16:9 with this tool: https://imagy.app/change-image-to-16x9-aspect-ratio/

Screenshots can be captured in 16:9 format using ShareX with the fixed region option.

Keep images size below 200kB to improve page loading speed.

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

## Licenses

Source code license: `CODE_LICENSE.txt`

Data (eg. JSON and images) license: `DATA_LICENSE.txt`
