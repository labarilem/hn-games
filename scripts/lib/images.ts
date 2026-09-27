import { promises as fs } from "fs";
import path from "path";
import { chromium, type Browser, type Page, type Locator } from "playwright";
import { getGamePageError } from "./link-page";

const IMAGES_PATH = path.join(__dirname, "../../public/images/games");
const VIEWPORT = { width: 1280, height: 720 };

type ImageGame = { id: string; name: string; playUrl: string };
type ImageOptions = { overwrite?: boolean; outputDirectory?: string };

export function gameImageUrl(id: string): string {
  if (!/^\d+$/.test(id)) throw new Error(`Invalid game ID: ${id}`);
  return `/images/games/${id}.jpg`;
}

async function captureJpeg(target: Page | Locator): Promise<Buffer> {
  let image = await target.screenshot({
    type: "jpeg",
    quality: 70,
    timeout: 15_000,
  });
  if (image.length > 200_000) {
    image = await target.screenshot({
      type: "jpeg",
      quality: 40,
      timeout: 15_000,
    });
  }
  return image;
}

/** Use gallery artwork, excluding store chrome, icons, and recommendations. */
export async function storeGalleryImage(
  page: Page,
): Promise<Buffer | undefined> {
  const hostname = new URL(page.url()).hostname;
  const apple = ["apps.apple.com", "itunes.apple.com"].includes(hostname);
  if (!apple && hostname !== "play.google.com") return;

  const selector = apple
    ? '[aria-label="Screenshot"] img, .we-screenshot img, img.we-screenshot'
    : 'img[data-screenshot-index], img[alt="Screenshot image"]';
  const sources = await page.locator(selector).evaluateAll((images) =>
    images.map((element) => {
      const image = element as HTMLImageElement;
      const sourceSet =
        image
          .closest("picture")
          ?.querySelector("source[srcset]")
          ?.getAttribute("srcset") || image.srcset;
      const largest = sourceSet
        .split(",")
        .map((entry) => entry.trim().split(/\s+/))
        .sort(
          (a, b) => parseFloat(b[1] || "0") - parseFloat(a[1] || "0"),
        )[0]?.[0];
      return largest || image.currentSrc || image.src;
    }),
  );

  if (!sources.length) return;
  const artwork = await page.context().newPage();
  try {
    // Try several gallery entries in case an individual asset has disappeared.
    for (const source of Array.from(new Set(sources)).slice(0, 6)) {
      if (!/^https?:\/\//.test(source)) continue;
      try {
        const response = await page
          .context()
          .request.get(source, { timeout: 15_000 });
        try {
          if (!response.ok()) continue;
          const contentType = response.headers()["content-type"]?.split(";")[0];
          if (!contentType?.startsWith("image/")) continue;
          const data = (await response.body()).toString("base64");
          // Preserve portrait and landscape artwork without cropping, while
          // keeping the same maximum dimensions as ordinary screenshots.
          await artwork.setContent(
            `<body style="margin:0"><img style="display:block;max-width:${VIEWPORT.width}px;max-height:${VIEWPORT.height}px" src="data:${contentType};base64,${data}"></body>`,
          );
          await artwork.waitForFunction(
            () => {
              const image = document.querySelector("img");
              return image?.complete && image.naturalWidth > 0;
            },
            undefined,
            { timeout: 10_000 },
          );
          return await captureJpeg(artwork.locator("img"));
        } finally {
          await response.dispose();
        }
      } catch {
        // Keep the original store page intact for the screenshot fallback.
      }
    }
  } finally {
    await artwork.close();
  }
}

/** Capture local JPEGs used by the cards, detail pages, and archive validator. */
export async function scrapeGameImages(
  games: ImageGame[],
  options: ImageOptions = {},
) {
  const directory = options.outputDirectory ?? IMAGES_PATH;
  const results = { saved: 0, skipped: 0, failed: [] as string[] };
  let browser: Browser | undefined;

  await fs.mkdir(directory, { recursive: true });
  try {
    for (const game of games) {
      gameImageUrl(game.id);
      const imagePath = path.join(directory, `${game.id}.jpg`);
      const existing = await fs
        .stat(imagePath)
        .catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
          return null;
        });
      if (!options.overwrite && existing?.isFile() && existing.size > 0) {
        results.skipped++;
        continue;
      }

      let url: URL;
      try {
        url = new URL(game.playUrl);
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Expected an HTTP or HTTPS game URL");
        }
      } catch {
        console.warn(
          `Image failed for ${game.id} (${game.name}): invalid play URL`,
        );
        results.failed.push(game.id);
        continue;
      }

      if (!browser) {
        try {
          browser = await chromium.launch({ headless: true });
        } catch (error) {
          throw new Error(
            "Could not launch Chromium. Run npm run setup-images, then retry with npm run scrape-images.",
            { cause: error },
          );
        }
      }

      console.log(`Capturing image for ${game.id} (${game.name})`);
      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 1,
        acceptDownloads: false,
      });
      try {
        const page = await context.newPage();
        let navigationStatus: number | undefined;
        let navigationError: string | undefined;
        page.on("response", (response) => {
          if (
            response.request().isNavigationRequest() &&
            response.frame() === page.mainFrame()
          ) {
            navigationStatus = response.status();
            navigationError = undefined;
          }
        });
        page.on("requestfailed", (request) => {
          if (
            request.isNavigationRequest() &&
            request.frame() === page.mainFrame()
          ) {
            const error = request.failure()?.errorText;
            // Starting a new navigation can cancel the previous one normally.
            if (error && error !== "net::ERR_ABORTED") navigationError = error;
          }
        });
        const response = await page.goto(url.href, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        if (!response || !response.ok()) {
          throw new Error(
            `Page returned HTTP ${response?.status() ?? "unknown"}`,
          );
        }

        // Games often keep network connections open; allow rendering without
        // waiting for networkidle, which may never arrive.
        await page.waitForTimeout(5_000);
        if (navigationError)
          throw new Error(`Navigation failed: ${navigationError}`);
        if (navigationStatus !== undefined && navigationStatus >= 400) {
          throw new Error(
            `Redirect destination returned HTTP ${navigationStatus}`,
          );
        }
        const pageError = getGamePageError(await page.content());
        if (pageError) throw new Error(pageError);
        let screenshot: Buffer | undefined;
        try {
          screenshot = await storeGalleryImage(page);
        } catch (error) {
          console.warn(
            `Store gallery unavailable for ${game.id}: ${String(error)}`,
          );
        }
        if (screenshot) console.log(`Using store gallery image for ${game.id}`);
        else screenshot = await captureJpeg(page);
        // Capture completely before touching an existing, curated image.
        await fs.writeFile(imagePath, screenshot);
        results.saved++;
        if (screenshot.length > 200_000) {
          console.warn(
            `Image ${game.id}.jpg exceeds 200 kB; consider optimizing it.`,
          );
        }
      } catch (error) {
        results.failed.push(game.id);
        console.warn(
          `Image failed for ${game.id} (${game.name}): ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
  }

  console.log(
    `Images: ${results.saved} saved, ${results.skipped} existing, ${results.failed.length} failed.`,
  );
  if (results.failed.length) {
    console.warn(
      `Images needing review or retry: ${results.failed.join(", ")}`,
    );
  }
  return results;
}
