import axios from "axios";
import { promises as fs, readFileSync } from "fs";
import getUrls from "get-urls";
import path from "path";
import { stripHtml } from "string-strip-html";
import { Game, GameGenre } from "../src/types/game.js";
import checkpoint from "./data/checkpoint.js";

// Paths
const ARCHIVE_PATH = path.join(__dirname, "data/archive.json");
const OUTPUT_PATH = "./scripts/data/new.json";

// Load archive.json
const archive: Game[] = JSON.parse(readFileSync(ARCHIVE_PATH, "utf-8"));

async function isValidGameUrl(
  url: string
): Promise<{ isValid: boolean; responseText: string }> {
  if (!url) return { isValid: true, responseText: "" }; // Consider empty URLs as valid (they'll become empty strings in the entity)

  try {
    // NOTE: cloudflare filter is hard to implement, so we'll just ignore it for now
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
      },
      timeout: 5000, // 5 seconds
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400, // Consider 2xx and 3xx as valid
    });

    if (!res.data) {
      console.log(`Invalid URL (empty response body): ${url}`);
      return { isValid: false, responseText: "" };
    }

    const responseText =
      typeof res.data === "string" ? res.data : JSON.stringify(res.data);

    const parkedDomainsBlacklist = ["Porkbun Marketplace"];
    if (parkedDomainsBlacklist.some((b) => responseText.includes(b))) {
      console.log(`Invalid URL (blacklisted content): ${url}`);
      return { isValid: false, responseText };
    }

    return { isValid: true, responseText };
  } catch (error) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? error.message
        : "Unknown error";
    console.log(`Invalid URL (${msg}): ${url}`);
    return { isValid: false, responseText: "" };
  }
}

function cleanTitle(title: string) {
  // Remove "Show HN:" prefix and clean up the title
  return title
    .replace(/^Show HN:?\s*/i, "")
    .replace(/^\s*["-]\s*/, "")
    .trim();
}

/**
 * @param {string} title
 * @param {string} description
 * @param {string} playUrl
 */
function determinePlatforms(
  title: string,
  description: string,
  playUrl: string
) {
  const platforms = [];
  const text = (title + " " + description).toLowerCase();

  if (["web", "html", "browser"].some((x) => text.includes(x)))
    platforms.push("web");

  if (["desktop", "windows", "mac", "linux"].some((x) => text.includes(x)))
    platforms.push("desktop");

  if (
    ["console", "xbox", "playstation", "game boy", "gameboy"].some((x) =>
      text.includes(x)
    )
  )
    platforms.push("console");

  if (
    ["android", "play store"].some((x) => text.includes(x)) ||
    playUrl.includes("play.google.com")
  )
    platforms.push("android");

  if (
    [" ios", "app store", "iphone", "ipad"].some((x) => text.includes(x)) ||
    playUrl.includes("apple.com")
  )
    platforms.push("ios");

  // Default to web if no platform detected
  return platforms.length ? platforms : ["web"];
}

function determinePlayerModes(title: string, description: string) {
  const text = (title + " " + description).toLowerCase();
  const multiplayerKeywords = [
    "multiplayer",
    "multi-player",
    "multi player",
    "mmo",
  ];
  return multiplayerKeywords.some((x) => text.includes(x))
    ? ["multi"]
    : ["single"];
}

function determineGenres(title: string, description: string) {
  const text = (title + " " + description).toLowerCase();
  const genres = [];

  for (const genre of Object.values(GameGenre))
    if (text.includes(genre.toLowerCase())) genres.push(genre);

  if (!genres.length) genres.push(GameGenre.ACTION);

  return genres;
}

function determinePricing(title: string, description: string) {
  const text = (title + " " + description).toLowerCase();
  return text.includes("commercial") ||
    text.includes("paid") ||
    text.includes("buy")
    ? "paid"
    : "free";
}

function generateImageUrl(id: string) {
  // Implement image URL extraction logic based on your needs
  // This could involve fetching the page and extracting og:image meta tag
  // For now, return empty string
  return `/images/games/${id}.jpg`;
}

function getSourceCodeUrl(item: any, playUrl: string, responseText: string) {
  let sourceCodeUrl = null;

  // check urls
  sourceCodeUrl =
    item.candidateGameUrls.find(
      (x: string) => x.includes("github.com") || x.includes("gitlab.com")
    ) || null;
  if (sourceCodeUrl) return sourceCodeUrl;

  // check story text
  if (item.story_text) {
    const lowerStoryText = item.story_text.toLowerCase();
    const indicators = ["github", "gitlab", "source", "open"];
    const isOs = indicators.some((indicator) =>
      lowerStoryText.includes(indicator)
    );
    if (isOs) return true;
  }

  // check response text
  if (responseText) {
    const lowerResponseText = responseText.toLowerCase();
    const positiveIndicators = ["open source", "open-source", "source code"];
    const negativeIndicators = [
      "closed source",
      "not open source",
      "not open-source",
    ];
    const isOs =  positiveIndicators.some((indicator) => lowerResponseText.includes(indicator)) &&
      !negativeIndicators.some((indicator) => lowerResponseText.includes(indicator));
    if (isOs) return true;
  }

  return sourceCodeUrl;
}

async function scrapeSingleGame(gameId: string) {
  try {
    // Fetch single item from Algolia Hacker News API
    const { data } = await axios.get(
      `https://hn.algolia.com/api/v1/items/${gameId}`
    );
    await scrapeGames([data]);
  } catch (error) {
    console.error("Error scraping single game: ", error);
  }
}

async function scrapeInTimeRange() {
  try {
    // Fetch data from Algolia Hacker News API
    // docs https://hn.algolia.com/api#:~:text=%7D-,Search,-Sorted%20by%20relevance
    const from = checkpoint.fromTimestampInSeconds;
    const to = checkpoint.toTimestampInSeconds;
    const { data } = await axios.get(
      `https://hn.algolia.com/api/v1/search_by_date`,
      {
        params: {
          query: "game",
          tags: "show_hn",
          page: 0,
          hitsPerPage: 1000, // max page size
          numericFilters: `created_at_i>${from},created_at_i<${to}`,
          // created_at_i>X
          // created_at_i>X,created_at_i<Y
        },
      }
    );
    await scrapeGames(data.hits);
  } catch (error) {
    console.error("Error scraping games: ", error);
  }
}

async function scrapeGames(apiItems: any[]) {
  // preprocess data in response
  const preprocItems = apiItems.map((item: any) => {
    const title = stripHtml(item.title || "")
      .result.replace(/–/g, "-")
      .trim();
    const story_text = stripHtml(
      item.story_text || item.text || ""
    ).result.trim();
    const urlsInText = Array.from(
      getUrls(story_text, { requireSchemeOrWww: false })
    );
    const candidateGameUrls = item.url
      ? [item.url].concat(urlsInText)
      : urlsInText;
    return {
      ...item,
      title,
      story_text,
      candidateGameUrls,
    };
  });

  // Validate all items before processing
  console.log("Validating stories...");
  const blacklist = [
    "game engine",
    "game editor",
    "games editor",
    "game collection",
    "game library",
    "game maker",
    // "board game", might exclude some valid games
    // "card game", might exclude some valid games
    "game of life",
    "tutorial",
    "ebook",
    "course",
    "framework",
    "football game",
    "for video game",
    "nfl game",
    "nhl game",
    "sdk",
    "editor",
    "plugin",
    "game of thrones",
    "games of thrones",
    "gamers",
    "gamechanger",
    "game-changer",
    "gamestop",
    "game development",
    "game design",
    "game theory",
    "gameplay",
    "emulator",
    "games list",
    "marketplace",
    "toolkit",
  ];
  const itemsValidations = preprocItems.map((item: any) => ({
    item,
    isValid: true,
    responseText: "",
    validUrl: "",
  }));
  for (let i = 0; i < itemsValidations.length; i++) {
    const itemValidation = itemsValidations[i];

    // validate against words blacklist
    const lowTitle = itemValidation.item.title.toLowerCase();
    if (blacklist.some((word) => lowTitle.includes(word))) {
      itemValidation.isValid = false;
      console.log(`Blacklist match: ${lowTitle}`);
      continue;
    }

    // check for duplicates in this batch and archive
    const nextItems = itemsValidations.slice(i + 1) as Array<any>;
    const existingGames: Array<Pick<Game, "name" | "author" | "playUrl">> =
      nextItems
        .map((item: any) => ({
          name: item.item.title,
          author: item.item.author,
          playUrl: item.item.url,
        }))
        .concat(archive);

    const duplicate = existingGames.find(
      (game) =>
        // check for duplicate (title, author batches) pairs
        (game.name === itemValidation.item.title &&
          game.author === itemValidation.item.author) ||
        // check for duplicate URLS
        (game.playUrl != null && game.playUrl === itemValidation.item.url)
    );
    if (duplicate) {
      itemValidation.isValid = false;
      console.log(`Duplicate item detected: ${itemValidation.item.url}`);
      continue;
    }

    // validate urls
    let hasValidUrl = false;
    // item is considered valid if at least one URL is valid
    for (const urlInDesc of itemValidation.item.candidateGameUrls) {
      console.log("Validating " + i + "/" + itemsValidations.length, urlInDesc);
      // filter out items with invalid URLs
      const urlValidation = await isValidGameUrl(urlInDesc);
      if (urlValidation.isValid) {
        hasValidUrl = true;
        itemValidation.validUrl = urlInDesc;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    itemValidation.isValid = hasValidUrl;
  }

  //  transform into Game entities
  const games = itemsValidations
    .filter(({ isValid }: any) => isValid)
    .map(({ item, validUrl, responseText }: any) => {
      const id = item.story_id.toString();
      const playUrl = validUrl || "";
      return {
        id,
        name: cleanTitle(item.title),
        description: item.story_text || "",
        platforms: determinePlatforms(
          item.title,
          item.story_text || "",
          playUrl
        ),
        releaseDate: new Date(item.created_at),
        playerModes: determinePlayerModes(item.title, item.story_text || ""),
        author: item.author,
        genres: determineGenres(item.title, item.story_text || ""),
        hnUrl: `https://news.ycombinator.com/item?id=${id}`,
        hnPoints: item.points || 0,
        playUrl,
        pricing: determinePricing(item.title, item.story_text || ""),
        imageUrl: generateImageUrl(id) || "",
        sourceCodeUrl: getSourceCodeUrl(item, playUrl, responseText),
      };
    });

  // Write to new.json
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(games, null, 2));

  console.log(`Successfully scraped ${itemsValidations.length} games`);
  console.log(
    `Filtered out ${itemsValidations.filter(({ isValid }: any) => !isValid).length} items`
  );
}

// Parse CLI arguments
const args = process.argv.slice(2);
const idIndex = args.indexOf("--id");
const targetId =
  idIndex !== -1 && idIndex + 1 < args.length ? args[idIndex + 1] : null;

// Determine whether to scrape a single game or all games in time range
if (targetId) scrapeSingleGame(targetId);
else scrapeInTimeRange();
