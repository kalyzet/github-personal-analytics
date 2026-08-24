import { paginate } from "./client";
import type { GithubRelease } from "@/types/github";

export function listReleases(
  token: string,
  owner: string,
  repo: string,
  options: { maxPages?: number } = {},
): Promise<GithubRelease[]> {
  return paginate<GithubRelease>(token, `/repos/${owner}/${repo}/releases`, {
    maxPages: options.maxPages,
  });
}
