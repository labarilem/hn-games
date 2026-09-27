import { Platform as P, PlayerMode as M, Pricing } from "../../src/types/game";

export type MetadataInput = {
  name: string;
  description?: string;
  playUrl: string;
};

export type MetadataAssessment = {
  platforms: P[];
  playerModes: M[];
  pricing: Pricing | null;
  evidence: Record<"platforms" | "playerModes" | "pricing", string[]>;
  needsReview: ("platforms" | "playerModes" | "pricing")[];
};

// These rules consume the game's own title/description, not unfiltered store
// navigation, recommendations, README dependencies, or arbitrary page HTML.
function clauses(value: string): string[] {
  return value
    .replace(/[\u2010-\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\bnot only\b/gi, "")
    .split(/(?:[.!?](?:\s|$)|[;\n]|\bbut\b|\bhowever\b)/i)
    .map((part) =>
      part.replace(/\b(?:inspired by|unlike|similar to)\b.*/i, "").trim(),
    )
    .filter(Boolean);
}

function positiveEvidence(text: string[], pattern: RegExp): string[] {
  return text.filter((part) => {
    for (const match of Array.from(
      part.matchAll(new RegExp(pattern.source, "gi")),
    )) {
      const before = part.slice(0, match.index).slice(-90);
      const after = part.slice(
        match.index + match[0].length,
        match.index + match[0].length + 65,
      );
      if (
        /\b(?:no|not|never|without|isn't|aren't|doesn't|don't|can't|cannot|won't)\b[^,]{0,65}$/i.test(
          before,
        )
      )
        continue;
      if (
        /\b(?:plan(?:ning)?|hope|want|would like|coming|soon|eventually|future|will|potentially|considering)\b[^,]{0,75}$/i.test(
          before,
        )
      )
        continue;
      if (
        /^\s*(?:(?:is|are)\s+)?(?:not (?:supported|available|implemented)|unavailable|unsupported|coming soon|planned|only in the future)\b/i.test(
          after,
        )
      )
        continue;
      return true;
    }
    return false;
  });
}

function storePlatform(value: string): P | undefined {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return;
    if (
      url.hostname === "play.google.com" &&
      url.pathname === "/store/apps/details" &&
      url.searchParams.has("id")
    )
      return P.ANDROID;
    // Apple also distributes Mac-only apps here. Native desktop availability
    // needs an explicit macOS/Mac listing; the URL alone cannot distinguish it.
    if (url.hostname === "apps.apple.com" && /\/app\//.test(url.pathname))
      return P.IOS;
  } catch {
    /* Not a usable URL. */
  }
}

export function assessMetadata(input: MetadataInput): MetadataAssessment {
  const text = [...clauses(input.name), ...clauses(input.description ?? "")];
  const prose = text.map((part) => part.replace(/https?:\/\/\S+/gi, " "));
  const platforms = new Set<P>();
  const modes = new Set<M>();
  const evidence: MetadataAssessment["evidence"] = {
    platforms: [],
    playerModes: [],
    pricing: [],
  };
  const addPlatform = (platform: P, pattern: RegExp) => {
    const found = positiveEvidence(prose, pattern);
    if (found.length) {
      platforms.add(platform);
      evidence.platforms.push(...found);
    }
  };

  addPlatform(
    P.WEB,
    /\b(?:(?:in|within|inside) (?:your |the |a )?browser|desktop browsers?|browser[- ](?:based|games?|versions?|ports?|pdf viewers?)|webgpu|html5|html canvas|web[- ]based|web (?:game|app|version)|online version|play (?:it |the (?:actual )?game )?(?:here|on my site))\b/,
  );
  // A browser on Windows/Mac, or a desktop browser PDF viewer, is still web.
  addPlatform(
    P.DESKTOP,
    /\b(?:(?:native|desktop|downloadable) (?:games?|apps?|builds?|versions?|clients?)|built natively|run (?:it )?natively|download (?:it )?for (?:windows|macos|mac|linux)|(?:terminal|command[- ]line) (?:games?|snake)|(?:game|snake) (?:on|in|for) (?:your |the |a )?terminal|(?:requires?|needs?)\b[^.!?]{0,35}\b(?:pc|mac)\b)/,
  );
  if (!platforms.has(P.WEB)) {
    addPlatform(
      P.DESKTOP,
      /\b(?:(?:for|on|supports?|requires?) (?:windows|macos|linux)|(?:windows|macos|linux|mac) (?:game|app|build|download|version))\b/,
    );
  }
  addPlatform(
    P.CONSOLE,
    /\b(?:(?:for|on|supports?|released on) (?:the )?(?:xbox|playstation|nintendo switch|game ?boy)|(?:xbox|playstation|nintendo switch|game ?boy|console) (?:game|port|version|release|rom))\b/,
  );
  addPlatform(
    P.ANDROID,
    /\b(?:(?:for|on|supports?|available (?:for|on)) android|android (?:app|game|version|release)|android\s*:)/,
  );
  addPlatform(
    P.IOS,
    /\b(?:(?:for|on|supports?|available (?:for|on)) (?:ios|iphone|ipad)|(?:ios|iphone|ipad) (?:app|game|version|release)|ios\s*:)/,
  );
  // A mobile browser does not establish the existence of a native mobile app.
  if (platforms.has(P.WEB)) {
    for (const platform of [P.IOS, P.ANDROID]) {
      const nativePattern =
        platform === P.IOS
          ? /\b(?:ios|iphone|ipad)\b[^.!?]{0,35}\b(?:app|native|app store)\b|\b(?:native|app store)\b/
          : /\bandroid\b[^.!?]{0,35}\b(?:app|native|play store)\b|\b(?:native|play store)\b/;
      if (!positiveEvidence(prose, nativePattern).length)
        platforms.delete(platform);
    }
  }
  for (const url of [
    input.playUrl,
    ...text.flatMap((part) => part.match(/https?:\/\/[^\s<>"']+/gi) ?? []),
  ]) {
    const platform = storePlatform(url);
    if (!platform) continue;
    if (
      url !== input.playUrl &&
      !positiveEvidence(
        text,
        new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      ).length
    )
      continue;
    if (
      platform === P.IOS &&
      /\b(?:macos|mac[- ]only)\b/i.test(prose.join(" ")) &&
      !platforms.has(P.IOS)
    ) {
      platforms.add(P.DESKTOP);
      evidence.platforms.push(`Apple listing with Mac evidence: ${url}`);
    } else {
      platforms.add(platform);
      evidence.platforms.push(`Store listing: ${url}`);
    }
  }

  const addMode = (mode: M, pattern: RegExp) => {
    const found = positiveEvidence(prose, pattern);
    if (found.length) {
      modes.add(mode);
      evidence.playerModes.push(...found);
    }
  };
  addMode(
    M.SINGLE,
    /\b(?:single[- ]?player|solo (?:play|mode|game)|play (?:alone|solo)|(?:computer|ai)[- ]controlled opponent|opponent trained with reinforcement learning|(?:against|versus) (?:an? |the )?(?:ai|computer|bot)\b)/,
  );
  addMode(
    M.MULTI,
    /\b(?:multi[- ]?player|mmos?|mmorpgs?|co[- ]op(?:erative)? (?:game|play|mode)|play (?:with|against) (?:a |your )?friends?|(?:chat|compete|battle|trade) with (?:other players|people|humans)|(?:make|help) other players guess|players join|local (?:versus|co[- ]op)|hot[- ]seat)\b/,
  );
  for (const part of prose) {
    const range = /\b(\d+|one|two)\s*(?:-|to)\s*(\d+|four|eight)\s+players?\b/i;
    if (!positiveEvidence([part], range).length) continue;
    const match = part.match(range)!;
    const numeric = (value: string) =>
      ({ one: 1, two: 2, four: 4, eight: 8 })[value.toLowerCase()] ??
      Number(value);
    const min = numeric(match[1]),
      max = numeric(match[2]);
    if (max < min) continue;
    if (min === 1) modes.add(M.SINGLE);
    if (max > 1) modes.add(M.MULTI);
    evidence.playerModes.push(part);
  }

  const free = positiveEvidence(
    prose,
    /\b(?:free[- ]to[- ]play|(?:game|app|version|it) (?:is |is completely |is totally )?free|it's (?:completely )?free|(?:completely |totally )?free (?:(?:commercial|browser|puzzle) )?(?:game|app|download)|play (?:it |the game )?(?:for free|at no cost)|free and open[- ]source|free with)\b/,
  );
  const freemium = positiveEvidence(prose, /\bfreemium\b/);
  const extras = positiveEvidence(
    prose,
    /\b(?:in[- ]app purchases?|iap|paid (?:upgrades?|levels?|content|extras)|premium (?:upgrade|subscription|tier)|optional (?:purchases?|subscription))\b/,
  );
  const paid = positiveEvidence(
    prose,
    /\b(?:paid (?:game|app)|(?:buy|purchase) (?:the |this |my )?(?:game|app|full version)|(?:game|app|full (?:game|version)|access) requires? (?:a )?(?:paid )?subscription|(?:costs?|price(?:d)?(?: at)?|buy for|pay)\s*[$€£]\s*\d)/,
  );
  // Demo/trial access is not evidence that the full game is free.
  const trial =
    positiveEvidence(
      prose,
      /\b(?:free (?:trial|demo)|trial version|limited[- ]time free)\b/,
    ).length > 0;
  let pricing: Pricing | null = null;
  if (
    freemium.length ||
    (free.length && extras.length && !paid.length && !trial)
  )
    pricing = Pricing.FREEMIUM;
  else if (paid.length && (!free.length || trial)) pricing = Pricing.PAID;
  else if (free.length && !paid.length && !trial) pricing = Pricing.FREE;
  evidence.pricing = [...free, ...freemium, ...extras, ...paid];

  const result: MetadataAssessment = {
    platforms: Object.values(P).filter((value) => platforms.has(value)),
    playerModes: Object.values(M).filter((value) => modes.has(value)),
    pricing,
    evidence: {
      platforms: Array.from(new Set(evidence.platforms)),
      playerModes: Array.from(new Set(evidence.playerModes)),
      pricing: Array.from(new Set(evidence.pricing)),
    },
    needsReview: [],
  };
  if (!result.platforms.length) result.needsReview.push("platforms");
  if (!result.playerModes.length) result.needsReview.push("playerModes");
  if (!result.pricing) result.needsReview.push("pricing");
  return result;
}

// Preserve the existing pending-data contract. These compatibility defaults
// are assumptions, not detections, and must remain visible in scrape-review.
export function metadataForScrape(assessment: MetadataAssessment) {
  return {
    platforms: assessment.platforms.length ? assessment.platforms : [P.WEB],
    playerModes: assessment.playerModes.length
      ? assessment.playerModes
      : [M.SINGLE],
    pricing: assessment.pricing ?? Pricing.FREE,
  };
}
