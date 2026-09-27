import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import axios from "axios";
import { checkGameUrlForRemoval, isValidGameUrl } from "./url";

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
      return void response.end();
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
      "/mentions-registrar":
        "<title>My game</title><p>Thanks to Porkbun Marketplace for the domain.</p>",
      "/inert-error":
        "<title>My game</title><textarea><title>Page not found</title><h1>Porkbun Marketplace</h1></textarea>",
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
      "/mentions-registrar",
      "/inert-error",
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
  assert.equal(result.status, "unknown");
  assert.match(result.reason!, /altnames/);
});

test("keeps uncertain HTTP responses out of RIP and retries temporary failures", async (t) => {
  for (const status of [
    204, 302, 400, 401, 403, 408, 425, 429, 451, 500, 502, 503, 504, 521,
  ]) {
    await t.test(`HTTP ${status}`, async (t) => {
      const request = t.mock.method(axios, "get", async () => ({
        status,
        data: status === 204 ? "" : "Unavailable",
        headers: { "content-type": "text/html" },
      }));
      const result = await checkGameUrlForRemoval("https://game.example/", {
        retryDelayMs: 0,
      });
      assert.equal(result.status, "unknown");
      const retried = status >= 500 || status === 408 || status === 425;
      assert.equal(request.mock.callCount(), retried ? 3 : 1);
    });
  }
});

test("network and TLS failures are inconclusive, never evidence for RIP", async (t) => {
  for (const code of [
    "ENOTFOUND",
    "EAI_AGAIN",
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "CERT_HAS_EXPIRED",
    "ERR_CERT_AUTHORITY_INVALID",
  ]) {
    await t.test(code, async (t) => {
      t.mock.method(axios, "get", async () => {
        throw Object.assign(new Error("Request failed"), { code });
      });
      const result = await checkGameUrlForRemoval("https://game.example/", {
        retryDelayMs: 0,
      });
      assert.equal(result.status, "unknown");
      assert.match(result.reason!, new RegExp(code));
    });
  }
});

test("confirms dead pages twice and keeps games that recover or become inconclusive", async (t) => {
  for (const [statuses, expected] of [
    [[404, 404], "dead"],
    [[410, 410], "dead"],
    [[404, 200], "alive"],
    [[404, 403], "unknown"],
    [[404, 429], "unknown"],
    [[404, 503, 503, 503], "unknown"],
    [[500, 200], "alive"],
  ] as const) {
    await t.test(statuses.join(" -> "), async (t) => {
      let index = 0;
      const request = t.mock.method(axios, "get", async () => ({
        status: statuses[index++],
        data: "<title>Game</title><canvas></canvas>",
        headers: { "content-type": "text/html" },
      }));
      const result = await checkGameUrlForRemoval("https://game.example/", {
        retryDelayMs: 0,
      });
      assert.equal(result.status, expected);
      assert.equal(request.mock.callCount(), statuses.length);
    });
  }
});

test("recognizes bot challenges even with success or not-found HTTP status", async (t) => {
  for (const fixture of [
    { status: 200, data: "<title>Just a moment...</title>", headers: {} },
    {
      status: 404,
      data: "<title>Page not found</title>",
      headers: { "cf-mitigated": "challenge" },
    },
    {
      status: 200,
      data: "<title>Vercel Security Checkpoint</title>",
      headers: {},
    },
  ]) {
    await t.test(fixture.data + fixture.status, async (t) => {
      t.mock.method(axios, "get", async () => ({
        ...fixture,
        headers: { "content-type": "text/html", ...fixture.headers },
      }));
      const result = await checkGameUrlForRemoval("https://game.example/", {
        retryDelayMs: 0,
      });
      assert.equal(result.status, "unknown");
      assert.equal(result.reason, "Bot challenge");
    });
  }
});

test("tries HTTPS when an old HTTP URL has a connection failure", async (t) => {
  const request = t.mock.method(axios, "get", async (url: string) => {
    if (url.startsWith("http:")) throw new Error("ECONNREFUSED");
    return {
      status: 200,
      data: "<title>Game</title>",
      headers: { "content-type": "text/html" },
    };
  });
  const result = await checkGameUrlForRemoval("http://game.example/", {
    retryDelayMs: 0,
  });
  assert.equal(result.status, "alive");
  assert.equal(request.mock.callCount(), 4);
});
