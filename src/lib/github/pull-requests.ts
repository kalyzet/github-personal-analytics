import { paginate } from "./client";
import type { GithubPullRequest } from "@/types/github";

export function listPullRequests(
  token: string,
  owner: string,
  repo: string,
  options: { since?: string; maxPages?: number } = {},
): Promise<GithubPullRequest[]> {
  return paginate<GithubPullRequest>(token, `/repos/${owner}/${repo}/pulls`, {
    maxPages: options.maxPages,
    params: {
      state: "all",
      sort: "updated",
      direction: "desc",
    },
    stopWhen: options.since
      ? (pr) => new Date(pr.updated_at) < new Date(options.since!)
      : undefined,
  });
}
