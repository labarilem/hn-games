import getUrls from "get-urls";
import { stripHtml } from "string-strip-html";

export type GameAssessment = {
  verdict: "likely-game" | "not-game" | "review";
  reasons: string[];
};

type Candidate = { name: string; description?: string; playUrl?: string };
type Rule = { pattern: RegExp; reason: string };

// Match what the project is, rather than banning words such as "editor",
// "course", "gameplay", or "football" anywhere in a game announcement.
const TOOL_TITLES: Rule[] = [
  {
    pattern:
      /\b(?:game|games|gaming)\s+(?:engine|framework|sdk|editor|maker|builder|tracker|launcher|server\s+hosting)\b/i,
    reason: "Game development or management tool",
  },
  {
    pattern:
      /\b(?:visual novel\s+(?:creator|builder)|build a visual novel|(?:combat|proxy) manager|blueprint visualizer)\b/i,
    reason: "Creation or companion tool",
  },
  {
    pattern:
      /\b(?:pretty[ -]print|formatter|converter|serializ(?:e|er|ation)|system configuration|(?:rest(?:ful)?\s+)?api for)\b/i,
    reason: "Developer utility",
  },
  {
    pattern:
      /\b(?:game results|game rankings|league tables|arcade locations)\b/i,
    reason: "Tracks games or locations rather than providing a game",
  },
  {
    pattern:
      /\b(?:journal|user analytic(?:s)?|headshots|explainer videos|viral clips|stream(?:ing)? system|screenshot.*extension|freelance journey)\b/i,
    reason: "A non-game product or article",
  },
];

const GAME_WORDS =
  /\b(?:games?|puzzles?|rpgs?|roguelikes?|wordle|sudoku|tetris|hangman|snake|chess|tower defen[cs]e|brick breaker|text adventure|guessing|quiz|quizzes|play tag|werewolf|hashi)\b/i;
const GAME_CLAIM =
  /\b(?:(?:i|we)(?:['’]ve| have)?\s+(?:built|made|created|developed)|(?:built|made|created|developed)|this is|it (?:is|combines)|it['’]s)\s+(?:(?:a|an|my|our|this|the)\s+)?(?:(?!app\b|tool\b|api\b|to\b|for\b)[\w-]+\s+){0,7}(?:game|puzzle|rpg|wordle|hangman)\b/i;
const GAME_DESCRIPTION =
  /\b(?:a|an|my|our|this)\s+(?:(?!app\b|tool\b|api\b|to\b|for\b)[\w-]+\s+){0,5}game\s+(?:where|that|called|in which)\b/i;

export function isReferenceUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    return [
      "news.ycombinator.com",
      "youtube.com",
      "youtu.be",
      "x.com",
      "twitter.com",
      "linkedin.com",
      "reddit.com",
      "veed.io",
    ].some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return true;
  }
}

export function assessGame(candidate: Candidate): GameAssessment {
  const title = candidate.name.replace(/^show hn\s*:\s*/i, "");
  const description = candidate.description ?? "";
  const intro = description.slice(0, 700);
  const claimText = `${title}. ${intro}`
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ");
  const gameClaim =
    GAME_CLAIM.test(claimText) || GAME_DESCRIPTION.test(claimText);
  const titleRules = TOOL_TITLES.filter(({ pattern }) => pattern.test(title));
  if (titleRules.length) {
    // A game about developing tools, or with an editor, can still be a game.
    const conflictingClaim = /\bgame\s+(?:about|where|with|built|made)\b/i.test(
      title,
    );
    return {
      verdict: conflictingClaim ? "review" : "not-game",
      reasons: titleRules.map(({ reason }) => reason),
    };
  }

  const toolIntro =
    /\b(?:a|an|our|this|my|the)\s+(?:[\w-]+\s+){0,5}(?:game engine|(?:site\/)?game builder|visual novel creator|toolkit|to-do list app|motivation tool|analytics platform)\b/i.test(
      intro,
    ) ||
    /\b(?:app|tool)\s+(?:to|that (?:lets|helps) you)\s+(?:keep track|track|manage|format)\b/i.test(
      intro,
    );
  if (toolIntro && !gameClaim && !GAME_WORDS.test(title)) {
    return {
      verdict: "not-game",
      reasons: [
        "The description introduces a tool or utility; game references are incidental",
      ],
    };
  }

  const reasons: string[] = [];
  if (GAME_WORDS.test(title))
    reasons.push("Title describes a game or recognizable game type");
  if (gameClaim)
    reasons.push("Description or title explicitly introduces a playable game");
  if (
    /\b(?:your goal|players? (?:guess|solve|compete)|you (?:have to|must) (?:guess|solve)|the goal is to (?:eliminate|guess|solve))\b/i.test(
      description,
    )
  ) {
    reasons.push("Describes a player objective");
  }
  if (candidate.playUrl && isReferenceUrl(candidate.playUrl)) {
    return {
      verdict: "review",
      reasons: [
        ...reasons,
        "Selected link is a discussion, social post, or video; find the actual game",
      ],
    };
  }
  if (
    /\b(?:gamifi(?:ed|cation)|game-inspired|game[- ]based learning|ai tutor)\b/i.test(
      `${title} ${intro}`,
    ) &&
    !gameClaim
  ) {
    return {
      verdict: "review",
      reasons: [
        "Gamification alone does not establish that the product is a game",
      ],
    };
  }
  if (reasons.length) return { verdict: "likely-game", reasons };
  return {
    verdict: "review",
    reasons: ["No clear game evidence in the title or description"],
  };
}

/** Keep complete anchor targets, including when HN truncates their visible text. */
export function candidateGameUrls(
  storyUrl: string | undefined,
  storyHtml: string,
): string[] {
  const anchors = Array.from(
    storyHtml.matchAll(
      /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    ),
  );
  const text = stripHtml(storyHtml).result;
  const raw = [
    storyUrl ?? "",
    ...anchors.map((match) => stripHtml(match[1]).result),
    ...Array.from(
      getUrls(text, {
        requireSchemeOrWww: false,
        stripHash: false,
        removeQueryParameters: [],
        stripWWW: false,
      }),
    ),
  ];
  const ranked = new Map<string, number>();
  for (const value of raw) {
    let candidate = value.trim().replace(/[.,;]+$/, "");
    while (
      candidate.endsWith(")") &&
      (candidate.match(/\)/g)?.length ?? 0) >
        (candidate.match(/\(/g)?.length ?? 0)
    )
      candidate = candidate.slice(0, -1);
    try {
      const url = new URL(candidate);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        isReferenceUrl(url.href) ||
        /(?:\.\.\.|…)/.test(url.href)
      )
        continue;
      const anchor = anchors.find(
        (match) => stripHtml(match[1]).result === candidate,
      );
      const label = anchor?.[2] ?? "";
      const position = text.indexOf(candidate);
      const before = anchor
        ? stripHtml(storyHtml.slice(0, anchor.index)).result.slice(-65)
        : position >= 0
          ? text.slice(Math.max(0, position - 65), position)
          : "";
      const explicitlyPlayable =
        /\b(?:play(?: (?:it|the (?:actual )?game))?(?: (?:here|(?:on my site )?at|on my site))?|try (?:it|the game)(?: (?:here|at))?)\s*[:\-]?\s*$/i.test(
          before,
        ) || /\bplay\b/i.test(stripHtml(label).result);
      const sourceHost =
        /^(?:www\.)?(?:github\.com|gitlab\.com|codeberg\.org|bitbucket\.org)$/.test(
          url.hostname,
        );
      const score = explicitlyPlayable
        ? 3
        : value === storyUrl
          ? 2
          : sourceHost
            ? 0
            : 1;
      ranked.set(url.href, Math.max(ranked.get(url.href) ?? -1, score));
    } catch {
      /* Ignore malformed links rather than treating them as playable. */
    }
  }
  return Array.from(ranked)
    .sort((a, b) => b[1] - a[1])
    .map(([url]) => url);
}
