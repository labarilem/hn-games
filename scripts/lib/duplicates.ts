export type DuplicateGame = {
  id: string;
  name: string;
  author: string;
  playUrl: string;
  description?: string;
};

export type GameEntry = { game: DuplicateGame; source: string };
export type DuplicateMatch = {
  left: GameEntry;
  right: GameEntry;
  reasons: string[];
  confidence: "exact" | "possible";
};

// These are comparison keys, never replacement play URLs. Preserve path case,
// game-selecting query parameters, and fragments (which can be client routes).
export function duplicateUrlKey(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, "");
    if (host === "apps.apple.com") {
      const id = url.pathname.match(/\/id(\d+)(?:\/|$)/)?.[1];
      if (id) return `apps.apple.com/app/${id}${url.hash}`;
    }
    if (host === "store.steampowered.com") {
      const id = url.pathname.match(/^\/app\/(\d+)(?:\/|$)/)?.[1];
      if (id) return `store.steampowered.com/app/${id}${url.hash}`;
    }
    for (const key of Array.from(url.searchParams.keys())) {
      if (
        /^(utm_.+|fbclid|gclid|msclkid|mc_cid|mc_eid)$/i.test(key) ||
        (host === "play.google.com" && ["hl", "gl"].includes(key))
      ) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    return (
      host +
      (url.port ? `:${url.port}` : "") +
      url.pathname.replace(/\/$/, "") +
      url.search +
      url.hash
    );
  } catch {
    return null;
  }
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/^show hn\s*:\s*/, "")
    .replace(/[.,:;!?"'“”‘’()[\]{}–—_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shingles(text: string, size: number): Set<string> {
  const words = normalizeText(text.replace(/https?:\/\/\S+/g, "")).split(" ");
  const result = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) {
    result.add(words.slice(i, i + size).join(" "));
  }
  return result;
}

function similarity(a: Set<string>, b: Set<string>): number {
  const intersection = Array.from(a).filter((value) => b.has(value)).length;
  return intersection / (a.size + b.size - intersection || 1);
}

/** Report each pair once, combining all evidence. Never delete fuzzy matches. */
export function findDuplicates(entries: GameEntry[]): DuplicateMatch[] {
  const prepared = entries.map((entry) => ({
    ...entry,
    url: duplicateUrlKey(entry.game.playUrl),
    title: normalizeText(entry.game.name),
    author: entry.game.author.trim().toLowerCase(),
    titleWords: shingles(entry.game.name, 1),
    descriptionWords: shingles(entry.game.description ?? "", 4),
  }));
  const matches: DuplicateMatch[] = [];
  for (let i = 0; i < prepared.length; i++) {
    for (let j = i + 1; j < prepared.length; j++) {
      const a = prepared[i];
      const b = prepared[j];
      const reasons: string[] = [];
      if (a.game.id && a.game.id === b.game.id) reasons.push("same HN ID");
      if (a.url && a.url === b.url) reasons.push("same game URL");
      if (a.author && a.author === b.author) {
        if (a.title && a.title === b.title)
          reasons.push("same title and author");
        else {
          if (
            Math.min(a.titleWords.size, b.titleWords.size) >= 5 &&
            similarity(a.titleWords, b.titleWords) >= 0.8
          ) {
            reasons.push("similar title by the same author");
          }
          if (
            Math.min(a.descriptionWords.size, b.descriptionWords.size) >= 25 &&
            similarity(a.descriptionWords, b.descriptionWords) >= 0.8
          ) {
            reasons.push("near-identical description by the same author");
          }
        }
      }
      if (reasons.length)
        matches.push({
          left: entries[i],
          right: entries[j],
          reasons,
          confidence: reasons.some((reason) => reason.startsWith("same "))
            ? "exact"
            : "possible",
        });
    }
  }
  return matches;
}
