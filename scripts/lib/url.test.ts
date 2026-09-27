import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import axios from "axios";
import { isValidGameUrl } from "./url";

test("validates redirect destinations and page content with a local HTTP server", async (t) => {
  const requested: string[] = [];
  const server = createServer((request, response) => {
    const route = request.url!;
    requested.push(route);
    response.setHeader("Content-Type", "text/html");
    if (route === "/gone") return void response.writeHead(410).end("Gone");
    if (route === "/missing")
      return void response.writeHead(404).end("Missing");
    if (route === "/blocked")
      return void response.writeHead(403).end("Forbidden");
    if (route === "/limited")
      return void response.writeHead(429).end("Rate limited");
    if (route === "/empty") return void response.end();
    if (route === "/http")
      return void response.writeHead(302, { Location: "/nested/start" }).end();
    if (route === "/nested/start")
      return void response.end(
        '<meta http-equiv="refresh" content="0; url=../ok">',
      );
    if (route === "/header") {
      response.setHeader("Refresh", "0; url=/gone");
      return void response.end("Redirecting");
    }
    if (route === "/binary") {
      response.setHeader("Content-Type", "application/pdf");
      return void response.end("%PDF-1.7 <title>Page not found</title>");
    }
    if (route.startsWith("/chain/")) {
      const next = Number(route.slice(7)) + 1;
      return void response.end(
        `<meta http-equiv="refresh" content="0;url=/chain/${next}">`,
      );
    }
    const pages: Record<string, string> = {
      // Pinpoint's observed HTTP-200 redirect shell, with a local dead target.
      "/pinpoint": `<!DOCTYPE html><html><head><title>Redirecting...</title>
        <meta http-equiv="refresh" content="0; URL='/missing'" />
        <script>window.location.href = "/missing";</script>
        </head><body>If you're not redirected, click here.</body></html>`,
      "/ok": "<title>Game</title><canvas></canvas>",
      "/entities":
        '<base href="/nested/"><META content="0; URL=&quot;../ok?a=1&amp;b=2&quot;" HTTP-EQUIV="Refresh">',
      "/ok?a=1&b=2": "<title>Game with parameters</title>",
      "/js": '<script>window.location.replace("/gone");</script>',
      "/js-assign": '<script>location.href = "/ok";</script>',
      "/conditional":
        '<title>Game</title><script>if (loggedOut) location.href = "/gone";</script>',
      "/template":
        '<title>Game</title><template><script>location.href = "/gone";</script><meta http-equiv="refresh" content="0;url=/gone"></template>',
      "/comment":
        '<title>Game</title><!-- <meta http-equiv="refresh" content="0;url=/gone"> -->',
      "/mentions-404":
        '<title>Error 404 Game</title><p>Page not found is a puzzle clue.</p><script>const message = "Porkbun Marketplace";</script>',
      "/soft404":
        "<title>Site not found &middot; GitHub Pages</title><h1>404</h1>",
      "/parked": "<title>Domain</title><h1>Porkbun Marketplace</h1>",
      "/loop-a": '<meta http-equiv="refresh" content="0;url=/loop-b">',
      "/loop-b": '<meta http-equiv="refresh" content="0;url=/loop-a">',
      "/self": '<meta http-equiv="refresh" content="0;url=/self">',
      "/fragment":
        '<script>location.href = "#/play";</script><div id="app"></div>',
      "/unsupported":
        '<meta http-equiv="refresh" content="0;url=file:///secret">',
    };
    response.end(pages[route] ?? "<title>Unexpected route</title>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const root = `http://127.0.0.1:${address.port}`;
  try {
    for (const [route, reason] of Object.entries({
      "/pinpoint": "HTTP 404",
      "/header": "HTTP 410",
      "/js": "HTTP 410",
      "/soft404": "page-not-found response (HTTP success status)",
      "/parked": "parked domain",
      "/loop-a": "Redirect loop",
      "/self": "Redirect loop",
      "/chain/0": "Too many page redirects",
      "/unsupported": "Expected an HTTP or HTTPS game URL",
      "/empty": "empty response body",
    })) {
      await t.test(`rejects ${route}`, async () => {
        const result = await isValidGameUrl(root + route);
        assert.equal(result.isValid, false);
        assert.equal(result.reason, reason);
      });
    }
    for (const route of [
      "/ok",
      "/http",
      "/entities",
      "/js-assign",
      "/conditional",
      "/template",
      "/comment",
      "/mentions-404",
      "/fragment",
      "/binary",
      "/blocked",
      "/limited",
    ]) {
      await t.test(`accepts ${route}`, async () => {
        assert.equal((await isValidGameUrl(root + route)).isValid, true);
      });
    }
    assert.ok(requested.includes("/missing"));
    assert.ok(requested.includes("/ok?a=1&b=2"));
    assert.equal(requested.includes("/chain/6"), false);
    assert.equal(
      (await isValidGameUrl(root + "/http")).responseText,
      "<title>Game</title><canvas></canvas>",
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("rejects missing, malformed, and non-web URLs", async () => {
  for (const url of [
    "",
    "   ",
    "not a URL",
    "file:///secret",
    "data:text/html,game",
    "ftp://example.com/game",
  ]) {
    assert.equal((await isValidGameUrl(url)).isValid, false);
  }
});

test("certificate hostname errors are not treated as successful game pages", async (t) => {
  t.mock.method(axios, "get", async () => {
    throw new Error("Hostname/IP does not match certificate's altnames");
  });
  const result = await isValidGameUrl("https://game.example/");
  assert.equal(result.isValid, false);
  assert.match(result.reason!, /altnames/);
});
