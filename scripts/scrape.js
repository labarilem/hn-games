import axios from "axios";
import { promises as fs } from "fs";
import getUrls from "get-urls";
import path from "path";
import { stripHtml } from "string-strip-html";
import checkpoint from "./data/checkpoint.js";

const beforeTimestamp = checkpoint.lastTimestampInSeconds;

async function isValidGameUrl(url) {
  if (!url) return true; // Consider empty URLs as valid (they'll become empty strings in the entity)

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
  };

  try {
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
    // NOTE: cloudflare filter is hard to implement, so we'll just ignore it for now

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
    const { data } = await axios.get(
      `https://hn.algolia.com/api/v1/search_by_date`,
      {
        params: {
          query: "game",
          tags: "show_hn",
          page: 0,
          hitsPerPage: 1000, // max page size
          numericFilters: `created_at_i<${beforeTimestamp}`,
          // created_at_i>X,created_at_i<Y
        },
      }
    );

    // Clean data in response
    const preprocessedData = data.hits.map((item) => {
      const title = stripHtml(item.title || "").result.trim();
      const story_text = stripHtml(item.story_text || "").result.trim();
      const candidateGameUrls = item.url
        ? [item.url]
        : getUrls(story_text, { requireSchemeOrWww: true });
      return {
        ...item,
        title,
        story_text,
        candidateGameUrls,
      };
    });

    // Validate all items before processing
    console.log("Validating URLs...");
    const itemsWithValidity = preprocessedData.map((item) => {
      return { item, isValid: false };
    });
    for (let i = 0; i < itemsWithValidity.length; i++) {
      const validItem = itemsWithValidity[i];
      for (const urlInDesc of validItem.item.candidateGameUrls) {
        console.log(
          "Validating " + i + "/" + itemsWithValidity.length,
          urlInDesc
        );
        validItem.isValid = await isValidGameUrl(urlInDesc);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Filter out items with invalid URLs and transform into Game entities
    const games = itemsWithValidity
      .filter(({ isValid }) => isValid)
      .map(({ item }) => ({
        id: item.objectID,
        name: cleanTitle(item.title),
        description: item.story_text || "",
        platforms: determinePlatforms(item.title, item.story_text || ""),
        releaseDate: new Date(item.created_at),
        playerMode: determinePlayerMode(item.title, item.story_text || ""),
        author: item.author,
        genre: determineGenre(item.title, item.story_text || ""),
        hnUrl: `https://news.ycombinator.com/item?id=${item.objectID}`,
        hnPoints: item.points || 0,
        playUrl: item.candidateGameUrls[0] || "",
        pricing: determinePricing(item.title, item.story_text || ""),
        imageUrl: extractImageUrl(item.url) || "",
      }));

    // Write to new.json
    const outputPath = "./scripts/data/new.json";
    await fs.writeFile(outputPath, JSON.stringify(games, null, 2));

    console.log(`Successfully scraped ${itemsWithValidity.length} games`);
    console.log(
      `Filtered out ${itemsWithValidity.filter(({ isValid }) => !isValid).length} items`
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

function determinePlatforms(title, description) {
  const platforms = [];
  const text = (title + " " + description).toLowerCase();

  if (
    text.includes("web") ||
    text.includes("html5") ||
    text.includes("browser")
  ) {
    platforms.push("web");
  }
  if (
    text.includes("desktop") ||
    text.includes("windows") ||
    text.includes("mac")
  ) {
    platforms.push("desktop");
  }
  if (
    text.includes("console") ||
    text.includes("xbox") ||
    text.includes("playstation")
  ) {
    platforms.push("console");
  }

  return platforms.length ? platforms : ["web"]; // Default to web if no platform detected
}

function determinePlayerMode(title, description) {
  const text = (title + " " + description).toLowerCase();
  return text.includes("multiplayer") ||
    text.includes("multi-player") ||
    text.includes("multi player")
    ? "multi"
    : "single";
}

function determineGenre(title, description) {
  const text = (title + " " + description).toLowerCase();

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
  // TODO: search for "buy" in website body
  return "free";
}

function extractImageUrl(url) {
  // Implement image URL extraction logic based on your needs
  // This could involve fetching the page and extracting og:image meta tag
  // For now, return empty string
  return "";
}

// Run the scraper
scrapeGames();
