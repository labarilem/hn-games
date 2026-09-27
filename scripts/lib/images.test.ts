import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { chromium } from "playwright";
import { gameImageUrl, scrapeGameImages, storeGalleryImage } from "./images";

test("captures rendered JPEGs, continues after failures, and preserves existing images", async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "hn-games-images-"));
  const server = createServer((request, response) => {
    if (request.url === "/missing") {
      response.writeHead(404).end("Not found");
      return;
    }
    response.setHeader("Content-Type", "text/html");
    if (request.url === "/delayed-redirect") {
      response.end(
        '<script>setTimeout(() => location.href = "/missing", 100)</script>',
      );
      return;
    }
    if (request.url === "/soft404") {
      response.end(
        "<title>Site not found &middot; GitHub Pages</title><h1>404</h1>",
      );
      return;
    }
    response.end(`<!doctype html><body style="margin:0;background:#112233">
      <script>setTimeout(() => document.body.style.background = '#ff6600', 4000)</script>
    </body>`);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}`;
  const options = { outputDirectory: directory };

  try {
    const preserved = Buffer.from("curated image");
    await fs.writeFile(path.join(directory, "1.jpg"), preserved);
    await fs.writeFile(path.join(directory, "4.jpg"), Buffer.alloc(0));
    const results = await scrapeGameImages(
      [
        { id: "1", name: "Existing", playUrl: `${url}/missing` },
        { id: "2", name: "Unsupported URL", playUrl: "file:///secret" },
        { id: "3", name: "Missing page", playUrl: `${url}/missing` },
        { id: "5", name: "Soft 404", playUrl: `${url}/soft404` },
        { id: "6", name: "Dead redirect", playUrl: `${url}/delayed-redirect` },
        { id: "4", name: "Rendered game", playUrl: url },
      ],
      options,
    );
    assert.deepEqual(results, {
      saved: 1,
      skipped: 1,
      failed: ["2", "3", "5", "6"],
    });
    assert.deepEqual(
      await fs.readFile(path.join(directory, "1.jpg")),
      preserved,
    );
    await assert.rejects(fs.stat(path.join(directory, "3.jpg")), {
      code: "ENOENT",
    });
    await assert.rejects(fs.stat(path.join(directory, "5.jpg")), {
      code: "ENOENT",
    });
    const jpeg = await fs.readFile(path.join(directory, "4.jpg"));
    await assert.rejects(fs.stat(path.join(directory, "6.jpg")), {
      code: "ENOENT",
    });
    assert.equal(jpeg.subarray(0, 3).toString("hex"), "ffd8ff");

    // Decode the actual output in a browser to check dimensions and delayed rendering.
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const decoded = await page.evaluate(async (data) => {
        const image = new Image();
        image.src = `data:image/jpeg;base64,${data}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        return {
          width: image.naturalWidth,
          height: image.naturalHeight,
          pixel: Array.from(context.getImageData(0, 0, 1, 1).data),
        };
      }, jpeg.toString("base64"));
      assert.equal(decoded.width, 1280);
      assert.equal(decoded.height, 720);
      assert.ok(
        decoded.pixel[0] > 245 &&
          decoded.pixel[1] > 90 &&
          decoded.pixel[2] < 10,
      );
    } finally {
      await browser.close();
    }

    const failedOverwrite = await scrapeGameImages(
      [{ id: "1", name: "Existing", playUrl: `${url}/missing` }],
      { ...options, overwrite: true },
    );
    assert.deepEqual(failedOverwrite.failed, ["1"]);
    assert.deepEqual(
      await fs.readFile(path.join(directory, "1.jpg")),
      preserved,
    );

    const replaced = await scrapeGameImages(
      [{ id: "1", name: "Replace", playUrl: url }],
      { ...options, overwrite: true },
    );
    assert.equal(replaced.saved, 1);
    assert.equal(
      (await fs.readFile(path.join(directory, "1.jpg")))
        .subarray(0, 3)
        .toString("hex"),
      "ffd8ff",
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("image paths accept HN IDs only", () => {
  assert.equal(gameImageUrl("123"), "/images/games/123.jpg");
  assert.throws(() => gameImageUrl("../outside"), /Invalid game ID/);
});

test("store galleries use full artwork, skip broken assets, and allow screenshot fallback", async () => {
  const server = createServer((request, response) => {
    if (request.url !== "/gallery.svg") {
      response.writeHead(404).end();
      return;
    }
    response.setHeader("Content-Type", "image/svg+xml");
    response.end(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><path fill="#ff6600" d="M0 0h600v900H0z"/></svg>',
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const asset = `http://127.0.0.1:${address.port}/gallery.svg`;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const fixtures = [
      {
        url: "https://apps.apple.com/us/app/test/id123",
        html: `<img src="${asset}"><div aria-label="Screenshot"><img src="${asset}/missing"></div><div aria-label="Screenshot"><picture><source srcset="${asset}/small 300w, ${asset} 600w"><img src="${asset}/placeholder"></picture></div>`,
      },
      {
        url: "https://play.google.com/store/apps/details?id=test",
        html: `<img alt="Icon image" src="${asset}"><img data-screenshot-index="0" src="${asset}/missing"><img data-screenshot-index="1" src="${asset}" srcset="${asset} 2x">`,
      },
    ];
    for (const fixture of fixtures) {
      await page.route(fixture.url, (route) =>
        route.fulfill({ contentType: "text/html", body: fixture.html }),
      );
      await page.goto(fixture.url);
      const jpeg = await storeGalleryImage(page);
      assert.ok(jpeg);
      assert.equal(jpeg.subarray(0, 3).toString("hex"), "ffd8ff");
      const dimensions = await page.evaluate(async (data) => {
        const image = new Image();
        image.src = `data:image/jpeg;base64,${data}`;
        await image.decode();
        return [image.naturalWidth, image.naturalHeight];
      }, jpeg.toString("base64"));
      assert.deepEqual(dimensions, [480, 720]);
      await page.setContent(`<img alt="Icon image" src="${asset}">`);
      assert.equal(await storeGalleryImage(page), undefined);
      await page.setContent(
        `<div aria-label="Screenshot"><img data-screenshot-index="0" src="${asset}/missing"></div>`,
      );
      assert.equal(await storeGalleryImage(page), undefined);
    }
  } finally {
    await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
