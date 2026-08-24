import { paginate } from "./client";
import type { GithubReview } from "@/types/github";

export function listPullRequestReviews(
  token: string,
  owner: string,
  repo: string,
  pullNumber: number,
  options: { maxPages?: number } = {},
): Promise<GithubReview[]> {
  return paginate<GithubReview>(
    token,
    `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
    { maxPages: options.maxPages },
  );
}
