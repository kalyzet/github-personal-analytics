import { paginate } from "./client";
import type { GithubIssue } from "@/types/github";

export function listIssues(
  token: string,
  owner: string,
  repo: string,
  options: { since?: string; maxPages?: number } = {},
): Promise<GithubIssue[]> {
  return paginate<GithubIssue>(token, `/repos/${owner}/${repo}/issues`, {
    maxPages: options.maxPages,
    params: {
      state: "all",
      sort: "updated",
      direction: "desc",
      since: options.since,
    },
  });
}
