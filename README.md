# hn-games

Hacker News games collection website.

## Development

Start the development server with:

```bash
npm run dev
```

## Scraping

1. Scrape new games with this command:

    ```bash
    npm run scrape
    ```

    results are saved in `scripts/data/new.json`.


2. Review those items to check if they are valid games. Then add metadata to the valid games.

3. Archive the new games with this command:

    ```bash
    npm run archive
    ```

    the items in `scripts/data/new.json` are validated (missing metadata checks) then moved to `scripts/data/archive.json`.

4. Compile the JSON data to `src/data/games.ts` with this command:

    ```bash
    npm run compile
    ```

## Link checking

Check all links with this command:

```bash
npm run check-links
```

the results are saved in `scripts/data/invalid-links.json`.
