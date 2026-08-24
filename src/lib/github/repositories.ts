import { paginate } from "./client";
import type { GithubRepository } from "@/types/github";

export function listAuthenticatedUserRepositories(
  token: string,
  options: { affiliation?: string; sort?: "created" | "updated" | "pushed" | "full_name"; maxPages?: number } = {},
): Promise<GithubRepository[]> {
  return paginate<GithubRepository>(token, "/user/repos", {
    maxPages: options.maxPages,
    params: {
      affiliation: options.affiliation ?? "owner,collaborator",
      sort: options.sort ?? "pushed",
      direction: "desc",
      visibility: "all",
    },
  });
}
