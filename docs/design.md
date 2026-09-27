# HN Games visual direction

An independent game library with the typography and structure of an arcade
magazine: warm charcoal surfaces, paper-colored text, restrained orange
navigation accents, condensed display type, and small monospace catalog labels.
The games' actual screenshots supply the color and personality.

## Reference research

- [itch.io's game catalog](https://itch.io/games): useful platform, genre,
  price, and multiplayer filters, with a direct route into independent games.
- [GOG's catalog](https://www.gog.com/en/games): browsable game artwork and
  clearly separated filtering, sorting, and game information.

These informed the browsing structure. HN Games has its own visual treatment,
copy, typography, and components. The orange accent connects it to Hacker News;
the compact cross-shaped mark references a directional pad.

## Application

- A community favorite is selected from the live catalog by HN points. No
  invented ratings, activity counts, or editorial endorsements.
- Screenshots use a consistent 16:9 frame. Cards align titles, descriptions,
  pricing, genre links, platform icons, HN points, authors, and play links.
- Desktop filters occupy a narrow sidebar. On mobile they expand above the
  results, while search and sorting remain visible. Filter state stays in the
  URL, including repeatable genre parameters.
- Game pages give the screenshot most of the space and group access,
  platforms, modes, creator, and source links into a separate information panel.
- Detail screenshot dialogs use native focus containment and Escape handling.
  All controls have visible keyboard focus; motion respects reduced-motion
  preferences. The offline archive labels unavailable games and omits play
  actions.
- Fonts are self-hosted. See `src/app/fonts/README.md` for sources and licenses.

## Editing the system

Color tokens live in `tailwind.config.ts` and `src/app/globals.css`. Display
fonts are configured in `src/app/layout.tsx`. Component styles live in the
global stylesheet with descriptive class names. Shared controls use `hn-*`
classes so forms and supporting pages inherit the same treatment.

Keep accent color purposeful, use actual game imagery, and keep browsing
controls visually quieter than titles and screenshots.
