import { githubRequest, paginate } from "./client";
import type { GithubCommitDetail, GithubCommitListItem } from "@/types/github";

export function listCommits(
  token: string,
  owner: string,
  repo: string,
  options: { since?: string; until?: string; maxPages?: number } = {},
): Promise<GithubCommitListItem[]> {
  return paginate<GithubCommitListItem>(
    token,
    `/repos/${owner}/${repo}/commits`,
    {
      maxPages: options.maxPages,
      params: { since: options.since, until: options.until },
    },
  );
}

export function getCommitDetail(
  token: string,
  owner: string,
  repo: string,
  sha: string,
): Promise<GithubCommitDetail> {
  return githubRequest<GithubCommitDetail>(
    token,
    `/repos/${owner}/${repo}/commits/${sha}`,
  );
}
