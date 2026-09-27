import axios from "axios";
import {
  getGamePageBlockReason,
  getGamePageError,
  getGamePageRedirect,
} from "./link-page";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36",
  Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
};

const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const MAX_PAGE_REDIRECTS = 5;

// Host is reachable but blocks bots or rate-limits automated checks.
const REACHABLE_BLOCKED_STATUSES = new Set([401, 403, 429]);

// Resource is gone.
const DEAD_STATUSES = new Set([404, 410]);

const TRANSIENT_ERROR_PATTERNS = [
  "eai_again",
  "etimedout",
  "econnreset",
  "econnaborted",
  "econnrefused",
  "enotfound",
  "enetunreach",
  "ehostunreach",
  "socket disconnected",
  "timeout of",
  "network timeout",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const code = "code" in error ? String(error.code) : "";
    return code ? `${code}: ${String(error.message)}` : String(error.message);
  }
  return "Unknown error";
}

function isTransientError(message: string): boolean {
  const lower = message.toLowerCase();
  return TRANSIENT_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
}

function isTlsOrCertError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("certificate") ||
    lower.includes("altnames") ||
    lower.includes("tls") ||
    lower.includes("ssl")
  );
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.href;
  } catch {
    return url.split("#")[0];
  }
}

function getUrlVariants(url: string): string[] {
  const normalized = normalizeUrl(url);
  const variants = [normalized];

  if (normalized.startsWith("http://")) {
    variants.push(normalized.replace("http://", "https://"));
  }

  return Array.from(new Set(variants));
}

type RequestResult =
  | {
      ok: true;
      status: number;
      responseText: string;
      inconclusiveReason?: string;
    }
  | {
      ok: false;
      status?: number;
      error: string;
      transient: boolean;
      tryNextVariant: boolean;
      dead?: boolean;
    };

async function requestUrl(
  url: string,
  visited = new Set<string>(),
  pageRedirects = 0,
): Promise<RequestResult> {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Expected an HTTP or HTTPS game URL");
    }
    const normalized = normalizeUrl(url);
    if (visited.has(normalized)) throw new Error("Redirect loop");
    visited.add(normalized);

    const res = await axios.get(url, {
      headers: BROWSER_HEADERS,
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: 5,
      responseType: "text",
      // Bound unexpectedly large downloads instead of buffering them indefinitely.
      maxContentLength: 5 * 1024 * 1024,
      validateStatus: () => true,
    });

    const responseText =
      typeof res.data === "string" ? res.data : JSON.stringify(res.data);

    const contentType = String(res.headers["content-type"] ?? "");
    const isHtml =
      /(?:text\/html|application\/xhtml\+xml)/i.test(contentType) ||
      (!contentType && /^\s*(?:<!doctype html|<html\b)/i.test(responseText));
    const blockReason =
      res.headers["cf-mitigated"] === "challenge"
        ? "Bot challenge"
        : isHtml
          ? getGamePageBlockReason(responseText)
          : undefined;
    if (REACHABLE_BLOCKED_STATUSES.has(res.status) || blockReason) {
      return {
        ok: true,
        status: res.status,
        responseText,
        inconclusiveReason:
          blockReason ?? `HTTP ${res.status}: access blocked or rate limited`,
      };
    }

    if (DEAD_STATUSES.has(res.status)) {
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
        transient: false,
        tryNextVariant: false,
        dead: true,
      };
    }

    if (res.status >= 500 || res.status === 408 || res.status === 425) {
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
        transient: true,
        tryNextVariant: false,
      };
    }

    if (res.status >= 300) {
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
        transient: false,
        tryNextVariant: false,
      };
    }

    const responseUrl: string = res.request?.res?.responseUrl ?? url;
    visited.add(normalizeUrl(responseUrl));
    const redirect = getGamePageRedirect(
      isHtml ? responseText : "",
      responseUrl,
      typeof res.headers.refresh === "string" ? res.headers.refresh : undefined,
    );
    if (redirect !== undefined) {
      if (pageRedirects >= MAX_PAGE_REDIRECTS)
        throw new Error("Too many page redirects");
      // A fragment-only redirect stays on the same document (e.g. SPA routing).
      if (normalizeUrl(redirect) !== normalizeUrl(responseUrl)) {
        return await requestUrl(redirect, visited, pageRedirects + 1);
      }
      if (new URL(redirect).hash === new URL(responseUrl).hash)
        throw new Error("Redirect loop");
    }

    const pageError = isHtml ? getGamePageError(responseText) : undefined;
    if (pageError) {
      return {
        ok: false,
        error: pageError,
        transient: false,
        tryNextVariant: false,
        dead: true,
      };
    }

    // An empty response cannot establish that a game has disappeared. Check
    // Refresh headers first because valid redirect shells can have no body.
    if (!responseText.trim()) {
      return {
        ok: false,
        error: "empty response body",
        transient: false,
        tryNextVariant: false,
      };
    }

    return { ok: true, status: res.status, responseText };
  } catch (error) {
    const errorMsg = getErrorMessage(error);

    return {
      ok: false,
      error: errorMsg,
      transient: isTransientError(errorMsg),
      tryNextVariant: isTlsOrCertError(errorMsg),
    };
  }
}

export type GameUrlResult = {
  // Keep the existing boolean API for scraping. Archive removal must use status.
  isValid: boolean;
  status: "alive" | "dead" | "unknown";
  responseText: string;
  reason?: string;
};

type CheckOptions = { retryDelayMs?: number };

export async function isValidGameUrl(
  url: string,
  options: CheckOptions = {},
): Promise<GameUrlResult> {
  if (!url?.trim())
    return {
      isValid: false,
      status: "unknown",
      responseText: "",
      reason: "Missing URL",
    };

  const variants = getUrlVariants(url);
  let lastError = "Unknown error";

  for (const variant of variants) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const result = await requestUrl(variant);

      if (result.ok) {
        return {
          isValid: true,
          status: result.inconclusiveReason ? "unknown" : "alive",
          responseText: result.responseText,
          reason: result.inconclusiveReason,
        };
      }

      lastError = result.error;

      if (result.dead) {
        return {
          isValid: false,
          status: "dead",
          responseText: "",
          reason: result.error,
        };
      }

      if (!result.transient && !result.tryNextVariant) {
        return {
          isValid: false,
          status: "unknown",
          responseText: "",
          reason: result.error,
        };
      }

      if (result.tryNextVariant) {
        break;
      }

      if (result.transient && attempt < MAX_RETRIES - 1) {
        await sleep((options.retryDelayMs ?? RETRY_DELAY_MS) * (attempt + 1));
        continue;
      }

      if (!result.transient) {
        break;
      }
    }
  }

  return {
    isValid: false,
    status: "unknown",
    responseText: "",
    reason: lastError,
  };
}

/** Require two explicit dead-page responses before removing an archived game. */
export async function checkGameUrlForRemoval(
  url: string,
  options: CheckOptions = {},
): Promise<GameUrlResult> {
  try {
    const first = await isValidGameUrl(url, options);
    if (first.status !== "dead") return first;
    await sleep(options.retryDelayMs ?? RETRY_DELAY_MS);
    const second = await isValidGameUrl(url, options);
    if (second.status !== "dead") return second;
    return { ...second, reason: `Confirmed on two checks: ${second.reason}` };
  } catch (error) {
    // A checker failure is never evidence that the game itself is dead.
    return {
      isValid: false,
      status: "unknown",
      responseText: "",
      reason: `Checker error: ${getErrorMessage(error)}`,
    };
  }
}
