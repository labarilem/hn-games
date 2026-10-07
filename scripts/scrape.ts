import axios from "axios";
import { promises as fs } from "fs";
import path from "path";
import { stripHtml } from "string-strip-html";
import { determineGenres } from "./lib/genres";
import { assessMetadata, metadataForScrape } from "./lib/metadata";
import { isValidGameUrl } from "./lib/url";
import { gameImageUrl } from "./lib/images";
import { assessGame, candidateGameUrls } from "./lib/game-detection";
import { findDuplicates, type DuplicateGame } from "./lib/duplicates";

// Paths
const OUTPUT_PATH = path.join(__dirname, "data/new.json");
const CHECKPOINT_PATH = path.join(__dirname, "data/checkpoint.json");

function cleanTitle(title: string) {
  // Remove "Show HN:" prefix and clean up the title
  return title
    .replace(/^Show HN:?\s*/i, "")
    .replace(/^\s*["-]\s*/, "")
    .trim();
}

function getSourceCodeUrl(item: any, playUrl: string, responseText: string) {
  let sourceCodeUrl = null;

  // check urls
  sourceCodeUrl =
    item.candidateGameUrls.find(
      (x: string) =>
        x.includes("github.com") ||
        x.includes("gitlab.com") ||
        x.includes("sourcehut.org") ||
        x.includes("bitbucket.org") ||
        x.includes("codeberg.org"),
    ) || null;
  if (sourceCodeUrl) return sourceCodeUrl;

  // check story text
  if (item.story_text) {
    const lowerStoryText = item.story_text.toLowerCase();
    const indicators = ["github", "gitlab", "source", "open"];
    const isOs = indicators.some((indicator) =>
      lowerStoryText.includes(indicator),
    );
    if (isOs) return null;
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
    const isOs =
      positiveIndicators.some((indicator) =>
        lowerResponseText.includes(indicator),
      ) &&
      !negativeIndicators.some((indicator) =>
        lowerResponseText.includes(indicator),
      );
    if (isOs) return null;
  }

  return sourceCodeUrl;
}

async function scrapeSingleGame(gameId: string) {
  try {
    // Fetch single item from Algolia Hacker News API
    const { data } = await axios.get(
      `https://hn.algolia.com/api/v1/items/${gameId}`,
    );
    await scrapeGames([data]);
  } catch (error) {
    console.error("Error scraping single game: ", error);
    process.exitCode = 1;
  }
}

async function scrapeInTimeRange() {
  try {
    const checkpoint = JSON.parse(
      await fs.readFile(CHECKPOINT_PATH, "utf8"),
    ) as {
      fromDay: string;
      toDay: string;
    };
    const from = Math.floor(new Date(checkpoint.fromDay).getTime() / 1000);
    const to = Math.floor(new Date(checkpoint.toDay).getTime() / 1000);

    // Fetch data from Algolia Hacker News API
    // docs https://hn.algolia.com/api#:~:text=%7D-,Search,-Sorted%20by%20relevance
    const endpoint = `https://hn.algolia.com/api/v1/search_by_date`;
    const fetchRange = async (
      rangeFrom: number,
      rangeTo: number,
    ): Promise<any[]> => {
      const { data } = await axios.get(endpoint, {
        params: {
          query: "game",
          tags: "show_hn",
          page: 0,
          hitsPerPage: 1000,
          numericFilters: `created_at_i>${rangeFrom},created_at_i<${rangeTo}`,
        },
      });
      if (data.nbHits <= data.hits.length || rangeTo - rangeFrom <= 1)
        return data.hits;
      const midpoint = Math.floor((rangeFrom + rangeTo) / 2);
      const [older, newer] = await Promise.all([
        fetchRange(rangeFrom, midpoint),
        fetchRange(midpoint, rangeTo),
      ]);
      return [...older, ...newer];
    };
    const hits = await fetchRange(from, to);
    const uniqueHits = Array.from(
      new Map(hits.map((hit) => [String(hit.objectID), hit])).values(),
    );
    console.log(`Fetched ${uniqueHits.length} unique Show HN stories.`);
    await scrapeGames(uniqueHits);
  } catch (error) {
    console.error("Error scraping games: ", error);
    process.exitCode = 1;
  }
}

async function scrapeGames(apiItems: any[]) {
  const existing = (
    await Promise.all(
      ["archive.json", "rip.json"].map(async (source) => {
        const games: DuplicateGame[] = JSON.parse(
          await fs.readFile(path.join(__dirname, "data", source), "utf8"),
        );
        return games.map((game) => ({ game, source }));
      }),
    )
  ).flat();
  const seenIds = new Set(existing.map(({ game }) => game.id));
  // preprocess data in response
  const preprocItems = apiItems.map((item: any) => {
    const title = stripHtml(item.title || "")
      .result.replace(/–/g, "-")
      .trim();
    const storyHtml = item.story_text || item.text || "";
    const story_text = stripHtml(storyHtml).result.trim();
    return {
      ...item,
      title,
      story_text,
      candidateGameUrls: candidateGameUrls(item.url, storyHtml),
    };
  });

  // Validate all items before processing
  console.log("Validating stories...");
  const itemsValidations = preprocItems.map((item: any) => ({
    item,
    isValid: true,
    responseText: "",
    validUrl: "",
    assessment: assessGame({
      name: item.title,
      description: item.story_text,
      playUrl: item.url,
    }),
    rejectionReason: "",
  }));
  const needsUrlValidation: { itemValidation: any; index: number }[] = [];
  for (let i = 0; i < itemsValidations.length; i++) {
    const itemValidation = itemsValidations[i];

    const id = String(
      itemValidation.item.story_id ??
        itemValidation.item.objectID ??
        itemValidation.item.id,
    );
    if (seenIds.has(id)) {
      itemValidation.isValid = false;
      itemValidation.rejectionReason =
        "HN ID already in archive, RIP, or this batch";
      console.log(`Duplicate HN ID: ${id}`);
      continue;
    }
    seenIds.add(id);
    if (itemValidation.assessment.verdict === "not-game") {
      itemValidation.isValid = false;
      itemValidation.rejectionReason =
        itemValidation.assessment.reasons.join("; ");
      console.log(
        `Non-game: ${itemValidation.item.title} (${itemValidation.rejectionReason})`,
      );
      continue;
    }

    needsUrlValidation.push({ itemValidation, index: i });
  }

  // URL checks are independent after duplicate/non-game screening. Cache
  // repeated links and keep a bounded concurrency so a large catch-up does
  // not overwhelm hosts.
  const URL_CONCURRENCY = 32;
  const urlValidationCache = new Map<
    string,
    ReturnType<typeof isValidGameUrl>
  >();
  for (
    let offset = 0;
    offset < needsUrlValidation.length;
    offset += URL_CONCURRENCY
  ) {
    const batch = needsUrlValidation.slice(offset, offset + URL_CONCURRENCY);
    await Promise.all(
      batch.map(async ({ itemValidation, index }) => {
        let hasValidUrl = false;
        for (const urlInDesc of itemValidation.item.candidateGameUrls) {
          console.log(
            "Validating " + index + "/" + itemsValidations.length,
            urlInDesc,
          );
          let validation = urlValidationCache.get(urlInDesc);
          if (!validation) {
            validation = isValidGameUrl(urlInDesc, {
              requestTimeoutMs: 8000,
              retryDelayMs: 200,
            });
            urlValidationCache.set(urlInDesc, validation);
          }
          const urlValidation = await validation;
          if (urlValidation.isValid) {
            hasValidUrl = true;
            itemValidation.validUrl = urlInDesc;
            itemValidation.responseText = urlValidation.responseText;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        itemValidation.isValid = hasValidUrl;
        if (!hasValidUrl)
          itemValidation.rejectionReason =
            "No reachable game or source link (discussion and video links are excluded)";
      }),
    );
  }

  //  transform into Game entities
  const games = itemsValidations
    .filter(({ isValid }: any) => isValid)
    .map(({ item, validUrl, responseText }: any) => {
      const id = String(item.story_id ?? item.objectID ?? item.id);
      const playUrl = validUrl || "";
      const metadata = assessMetadata({
        name: item.title,
        description: item.story_text,
        playUrl,
      });
      return {
        ...metadataForScrape(metadata),
        id,
        name: cleanTitle(item.title),
        description: item.story_text || "",
        releaseDate: new Date(item.created_at),
        author: item.author,
        genres: determineGenres(item.title, item.story_text || ""),
        hnUrl: `https://news.ycombinator.com/item?id=${id}`,
        hnPoints: item.points || 0,
        playUrl,
        imageUrl: gameImageUrl(id),
        sourceCodeUrl: getSourceCodeUrl(item, playUrl, responseText),
      };
    })
    // Keep new games in chronological order for review.
    .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime());

  // Write to new.json
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(games, null, 2));

  const duplicates = findDuplicates([
    ...existing,
    ...games.map((game) => ({ game, source: "new.json" })),
  ]).filter(
    (match) =>
      match.left.source === "new.json" || match.right.source === "new.json",
  );
  await fs.writeFile(
    path.join(__dirname, "data/scrape-review.json"),
    JSON.stringify(
      {
        stories: itemsValidations.map(
          ({ item, assessment, rejectionReason, validUrl }) => ({
            id: String(item.story_id ?? item.objectID ?? item.id),
            title: item.title,
            description: item.story_text,
            urls: item.candidateGameUrls,
            assessment,
            rejectionReason,
            selectedUrl: validUrl,
            metadata: assessMetadata({
              name: item.title,
              description: item.story_text,
              playUrl: validUrl || item.url || "",
            }),
          }),
        ),
        duplicates,
      },
      null,
      2,
    ),
  );
  console.log(
    `${duplicates.length} duplicate pairs need review. Details: scripts/data/scrape-review.json`,
  );

  console.log(
    "Uncertain metadata uses provisional web/single/free defaults; check metadata.needsReview in scripts/data/scrape-review.json before archiving.",
  );
  console.log(`Successfully scraped ${games.length} games`);
  console.log(
    `Filtered out ${itemsValidations.filter(({ isValid }: any) => !isValid).length} items`,
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
