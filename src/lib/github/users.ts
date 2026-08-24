import { githubRequest } from "./client";
import type { GithubUser } from "@/types/github";

export function getCurrentUser(token: string): Promise<GithubUser> {
  return githubRequest<GithubUser>(token, "/user");
}
