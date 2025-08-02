import newGithubIssueUrl from "new-github-issue-url";
import { basePublicUrl } from "../config/env";

const commonConfig = {
  user: "labarilem",
  repo: "hn-games",
  assignee: "labarilem",
};

export function createReportUrl(gameId: string): string {
  const gameUrl = new URL(`/game/${gameId}`, basePublicUrl).toString();
  return newGithubIssueUrl({
    ...commonConfig,
    title: `Report for Game #${gameId}`,
    body: `## Data\nID: ${gameId}\nURL: ${gameUrl}\n\n# Description\n<!--- Please describe the issue you encountered with this game -->`,
    labels: ["game-report"],
  });
}

export function createSubmitUrl(hnId: string): string {
  const hnUrl = `https://news.ycombinator.com/item?id=${hnId}`;
  return newGithubIssueUrl({
    ...commonConfig,
    title: `Add Game #${hnId}`,
    body: `## Game Details\n\n- HN URL: ${hnUrl}\n\n<!--- Please make sure the game isn't in the catalog before submitting  -->`,
    labels: ["game-submission"],
  });
}
