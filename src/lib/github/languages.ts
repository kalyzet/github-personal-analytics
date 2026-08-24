import { githubRequest } from "./client";

export interface LanguageBreakdown {
  language: string;
  bytes: number;
  percentage: number;
}

export async function getRepositoryLanguages(
  token: string,
  owner: string,
  repo: string,
): Promise<LanguageBreakdown[]> {
  const data = await githubRequest<Record<string, number>>(
    token,
    `/repos/${owner}/${repo}/languages`,
  );

  const total = Object.values(data).reduce((sum, bytes) => sum + bytes, 0);

  return Object.entries(data).map(([language, bytes]) => ({
    language,
    bytes,
    percentage: total > 0 ? (bytes / total) * 100 : 0,
  }));
}
