import axios from "axios";
import { getGamePageError, getGamePageRedirect } from "./link-page";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36",
  Accept: "*/*",
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
  "socket disconnected",
  "timeout of",
  "network timeout",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
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

function isExpiredCertificate(message: string): boolean {
  return message.toLowerCase().includes("certificate has expired");
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
  | { ok: true; status: number; responseText: string }
  | {
      ok: false;
      status?: number;
      error: string;
      transient: boolean;
      tryNextVariant: boolean;
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
      validateStatus: () => true,
    });

    const responseText =
      typeof res.data === "string" ? res.data : JSON.stringify(res.data);

    if (REACHABLE_BLOCKED_STATUSES.has(res.status)) {
      return { ok: true, status: res.status, responseText };
    }

    if (DEAD_STATUSES.has(res.status)) {
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
        transient: false,
        tryNextVariant: false,
      };
    }

    if (res.status >= 500) {
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
        transient:
          res.status === 502 || res.status === 503 || res.status === 504,
        tryNextVariant: false,
      };
    }

    if (res.status >= 400) {
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
        transient: false,
        tryNextVariant: false,
      };
    }

    if (!responseText) {
      return {
        ok: false,
        error: "empty response body",
        transient: false,
        tryNextVariant: false,
      };
    }

    const responseUrl: string = res.request?.res?.responseUrl ?? url;
    visited.add(normalizeUrl(responseUrl));
    const contentType = String(res.headers["content-type"] ?? "");
    const isHtml =
      /(?:text\/html|application\/xhtml\+xml)/i.test(contentType) ||
      (!contentType && /^\s*(?:<!doctype html|<html\b)/i.test(responseText));
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

export async function isValidGameUrl(
  url: string,
): Promise<{ isValid: boolean; responseText: string; reason?: string }> {
  if (!url?.trim())
    return { isValid: false, responseText: "", reason: "Missing URL" };

  const variants = getUrlVariants(url);
  let lastError = "Unknown error";

  for (const variant of variants) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const result = await requestUrl(variant);

      if (result.ok) {
        return { isValid: true, responseText: result.responseText };
      }

      lastError = result.error;

      if (isExpiredCertificate(result.error)) {
        console.log(`Invalid URL (${result.error}): ${url}`);
        return { isValid: false, responseText: "", reason: result.error };
      }

      if (!result.transient && !result.tryNextVariant) {
        console.log(`Invalid URL (${result.error}): ${url}`);
        return { isValid: false, responseText: "", reason: result.error };
      }

      if (result.tryNextVariant) {
        break;
      }

      if (result.transient && attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      if (!result.transient) {
        break;
      }
    }
  }

  console.log(`Invalid URL (${lastError}): ${url}`);
  return { isValid: false, responseText: "", reason: lastError };
}
