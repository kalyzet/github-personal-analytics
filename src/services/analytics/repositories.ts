import { sqlite } from "@/lib/db/client";
import {
  periodRange,
  toDateString,
  type PeriodKey,
} from "@/lib/utils/period";

export interface TopRepository {
  id: number;
  name: string;
  fullName: string;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  isArchived: boolean;
  isFork: boolean;
  commits: number;
  totalActivity: number;
  sharePercent: number;
}

export async function getTopRepositories(
  userId: number,
  period: PeriodKey,
  limit = 10,
): Promise<TopRepository[]> {
  const { start } = periodRange(period);
  const startIso = toIso(start);
  const startDate = toDateString(start);

  const rows = sqlite
    .prepare(
      `SELECT r.id, r.name, r.full_name, r.primary_language, r.stars, r.forks,
              r.is_archived, r.is_fork,
              COALESCE(c.commits, 0) AS commits,
              COALESCE(a.total_activity, 0) AS total_activity
       FROM repositories r
       LEFT JOIN (
         SELECT repository_id, COUNT(*) AS commits
         FROM commits
         WHERE committed_at >= ?
           AND author_login = (SELECT username FROM users WHERE id = ?)
         GROUP BY repository_id
       ) c ON c.repository_id = r.id
       LEFT JOIN (
         SELECT repository_id, SUM(total_activity) AS total_activity
         FROM repository_activity
         WHERE date >= ?
         GROUP BY repository_id
       ) a ON a.repository_id = r.id
       WHERE r.owner_id = ?`,
    )
    .all(startIso, userId, startDate, userId) as Array<
    Record<string, unknown>
  >;

  const grandTotal = rows.reduce(
    (sum, row) => sum + Number(row.commits),
    0,
  );

  return rows
    .map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      fullName: String(row.full_name),
      primaryLanguage: (row.primary_language as string) ?? null,
      stars: Number(row.stars),
      forks: Number(row.forks),
      isArchived: Boolean(row.is_archived),
      isFork: Boolean(row.is_fork),
      commits: Number(row.commits),
      totalActivity: Number(row.total_activity),
      sharePercent:
        grandTotal > 0 ? (Number(row.commits) / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.commits - a.commits || b.totalActivity - a.totalActivity)
    .slice(0, limit);
}

function toIso(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export interface RepoHealth {
  total: number;
  activeRepos: number;
  archived: number;
}

export async function getRepositoryHealth(
  userId: number,
): Promise<RepoHealth> {
  const rows = sqlite
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) AS archived,
              SUM(CASE WHEN is_archived = 0 AND github_pushed_at >= ? THEN 1 ELSE 0 END) AS active_repos
       FROM repositories WHERE owner_id = ?`,
    )
    .get(Math.floor((Date.now() - 90 * 24 * 3600 * 1000) / 1000), userId) as {
    total: number | null;
    archived: number | null;
    active_repos: number | null;
  };

  return {
    total: Number(rows.total ?? 0),
    archived: Number(rows.archived ?? 0),
    activeRepos: Number(rows.active_repos ?? 0),
  };
}
