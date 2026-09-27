import { stripHtml } from "string-strip-html";

// Inspect markup only. Never execute JavaScript supplied by a game page.
function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(tag))) {
    result[match[1].toLowerCase()] = stripHtml(
      match[2] ?? match[3] ?? match[4],
    ).result;
  }
  return result;
}

function refreshTarget(value: string): string | undefined {
  const match = value.match(/^\s*\d+(?:\.\d+)?\s*;\s*url\s*=\s*([\s\S]+)$/i);
  if (!match) return undefined;
  return match[1].trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
}

/** Return a declared redirect, resolved against the final HTTP response URL. */
export function getGamePageRedirect(
  html: string,
  responseUrl: string,
  refreshHeader?: string,
): string | undefined {
  const document = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(template|textarea|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const markup = document.replace(
    /<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    "",
  );
  const tags =
    markup.match(/<(?:meta|base)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi) ?? [];
  let baseUrl = responseUrl;
  const base = tags.find(
    (tag) => /^<base\b/i.test(tag) && attributes(tag).href,
  );
  if (base) baseUrl = new URL(attributes(base).href, responseUrl).href;

  // The HTTP Refresh header takes precedence over HTML meta refresh.
  let target = refreshHeader ? refreshTarget(refreshHeader) : undefined;
  for (const tag of tags) {
    if (target !== undefined) break;
    const attrs = attributes(tag);
    if (attrs["http-equiv"]?.toLowerCase() === "refresh") {
      target = refreshTarget(attrs.content ?? "");
    }
  }

  // Support simple unconditional literal redirects only, not code examples,
  // click handlers, conditionals, or computed URLs in application bundles.
  if (target === undefined) {
    const scripts = document.matchAll(
      /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
    );
    for (const script of Array.from(scripts)) {
      const attrs = attributes(script[1]);
      if (
        attrs.src ||
        (attrs.type &&
          !/^(?:module|(?:text|application)\/javascript)$/i.test(attrs.type))
      )
        continue;
      const match =
        script[2]
          .trim()
          .match(
            /^(?:(?:window|document)\.)?location(?:\.href)?\s*=\s*(["'])([^"'\\\r\n]+)\1\s*;?$/,
          ) ??
        script[2]
          .trim()
          .match(
            /^(?:(?:window|document)\.)?location\.(?:replace|assign)\(\s*(["'])([^"'\\\r\n]+)\1\s*\)\s*;?$/,
          );
      if (match) {
        target = match[2];
        break;
      }
    }
  }
  return target === undefined ? undefined : new URL(target, baseUrl).href;
}

/** Shared by HTTP checks and rendered screenshot capture. */
export function getGamePageError(html: string): string | undefined {
  const markup = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|template|textarea|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    );
  const title = stripHtml(
    markup.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? "",
  ).result.trim();
  const headings = Array.from(
    markup.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]\s*>/gi),
    (match) => stripHtml(match[1]).result.trim(),
  );
  // A game's credits or blog can mention a registrar without being a parked page.
  if ([title, ...headings].some((text) => /^porkbun marketplace$/i.test(text)))
    return "parked domain";
  if (
    /^(?:404\s*[-:|]\s*)?(?:page not found|site not found|404 not found)(?:\s*[-|\u00b7]\s*(?:github pages|netlify|vercel))?$/i.test(
      title,
    )
  ) {
    return "page-not-found response (HTTP success status)";
  }
  return undefined;
}

/** A challenge page proves neither that the game works nor that it is gone. */
export function getGamePageBlockReason(html: string): string | undefined {
  const markup = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|template|textarea|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    );
  const title = stripHtml(
    markup.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? "",
  ).result.trim();
  if (
    /^(?:just a moment\.{0,3}|attention required!?\s*[|–-]\s*cloudflare|verify (?:you are|you're) human|vercel security checkpoint)$/i.test(
      title,
    )
  ) {
    return "Bot challenge";
  }
  return undefined;
}
