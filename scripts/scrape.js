import axios from "axios";
import { promises as fs } from "fs";
import getUrls from "get-urls";
import { stripHtml } from "string-strip-html";
import checkpoint from "./data/checkpoint.js";

async function isValidGameUrl(url) {
  if (!url) return true; // Consider empty URLs as valid (they'll become empty strings in the entity)

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
  };

  try {
    // NOTE: cloudflare filter is hard to implement, so we'll just ignore it for now
    const res = await axios.get(url, {
      headers,
      timeout: 5000, // 5 seconds
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400, // Consider 2xx and 3xx as valid
    });
    res;
    if (!res.data) {
      console.log(`Invalid URL (empty response body): ${url}`);
      return false;
    }

    const blacklist = ["Porkbun Marketplace"];
    if (blacklist.some((b) => res.data.includes(b))) {
      console.log(`Invalid URL (blacklisted content): ${url}`);
      return false;
    }

    return true;
  } catch (error) {
    console.log(`Invalid URL (${error.message}): ${url}`);
    return false;
  }
}

async function scrapeGames() {
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

    // preprocess data in response
    const preprocItems = data.hits.map((item) => {
      const title = stripHtml(item.title || "")
        .result.replace(/–/g, "-")
        .trim();
      const story_text = stripHtml(item.story_text || "").result.trim();
      const candidateGameUrls = item.url
        ? [item.url]
        : getUrls(story_text, { requireSchemeOrWww: false });
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
      "board game",
      "card game",
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
      "level editor",
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
    ];
    const itemsValidations = preprocItems.map((item) => ({
      item,
      isValid: true,
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

      // check for duplicates
      const nextItems = itemsValidations.slice(i + 1);
      const duplicate = nextItems.find(
        (item) =>
          // check for duplicate (title, author batches) pairs
          (item.item.title === itemValidation.item.title &&
            item.item.author === itemValidation.item.author) ||
          // check for duplicate URLS
          (item.item.url != null && item.item.url === itemValidation.item.url)
      );
      if (duplicate) {
        itemValidation.isValid = false;
        const dupeInfo =
          itemValidation.item.url ??
          `${itemValidation.item.title} - ${itemValidation.item.author}`;
        console.log(`Duplicate item detected: ${itemValidation.item.url}`);
        continue;
      }

      // validate urls
      let hasValidUrl = false;
      for (const urlInDesc of itemValidation.item.candidateGameUrls) {
        console.log(
          "Validating " + i + "/" + itemsValidations.length,
          urlInDesc
        );
        // filter out items with invalid URLs
        if (await isValidGameUrl(urlInDesc)) {
          hasValidUrl = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      itemValidation.isValid = hasValidUrl;
    }

    //  transform into Game entities
    const games = itemsValidations
      .filter(({ isValid }) => isValid)
      .map(({ item }) => {
        const id = item.objectID;
        const playUrl = item.candidateGameUrls[0] || "";
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
          genre: determineGenre(item.title, item.story_text || ""),
          hnUrl: `https://news.ycombinator.com/item?id=${item.objectID}`,
          hnPoints: item.points || 0,
          playUrl,
          pricing: determinePricing(item.title, item.story_text || ""),
          imageUrl: generateImageUrl(id) || "",
        };
      });

    // Write to new.json
    const outputPath = "./scripts/data/new.json";
    await fs.writeFile(outputPath, JSON.stringify(games, null, 2));

    console.log(`Successfully scraped ${itemsValidations.length} games`);
    console.log(
      `Filtered out ${itemsValidations.filter(({ isValid }) => !isValid).length} items`
    );
  } catch (error) {
    console.error("Error scraping games: ", error);
  }
}

function cleanTitle(title) {
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
function determinePlatforms(title, description, playUrl) {
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

function determinePlayerModes(title, description) {
  const text = (title + " " + description).toLowerCase();
  return text.includes("multiplayer") ||
    text.includes("multi-player") ||
    text.includes("multi player")
    ? ["multi"]
    : ["single"];
}

function determineGenre(title, description) {
  const text = (title + " " + description).toLowerCase();

  if (text.includes("word")) return "word";
  if (text.includes("puzzle")) return "puzzle";
  if (text.includes("action")) return "action";
  if (text.includes("rpg")) return "rpg";
  if (text.includes("strategy")) return "strategy";
  if (text.includes("adventure")) return "adventure";
  if (text.includes("simulation")) return "simulation";
  if (text.includes("platformer")) return "platformer";
  if (text.includes("roguelike")) return "roguelike";

  return "action"; // Default genre
}

function determinePricing(title, description) {
  const text = (title + " " + description).toLowerCase();
  return text.includes("commercial") ||
    text.includes("paid") ||
    text.includes("buy")
    ? "paid"
    : "free";
}

function generateImageUrl(id) {
  // Implement image URL extraction logic based on your needs
  // This could involve fetching the page and extracting og:image meta tag
  // For now, return empty string
  return `/images/games/${id}.jpg`;
}

// Run the scraper
scrapeGames();
