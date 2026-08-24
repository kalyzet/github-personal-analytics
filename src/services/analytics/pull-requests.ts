import { sqlite } from "@/lib/db/client";
import { periodRange, type PeriodKey } from "@/lib/utils/period";

export interface PullRequestStats {
  total: number;
  open: number;
  closed: number;
  merged: number;
  mergeRate: number;
  avgLifetimeHours: number | null;
  avgAdditions: number | null;
  avgDeletions: number | null;
  avgChangedFiles: number | null;
}

export async function getPullRequestStats(
  userId: number,
  period: PeriodKey,
): Promise<PullRequestStats> {
  const { start } = periodRange(period);

  const row = sqlite
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN p.state = 'open' THEN 1 ELSE 0 END) AS open_count,
         SUM(CASE WHEN p.state = 'closed' AND p.is_merged = 0 THEN 1 ELSE 0 END) AS closed_count,
         SUM(CASE WHEN p.is_merged = 1 THEN 1 ELSE 0 END) AS merged_count,
         AVG(CASE WHEN p.merged_at IS NOT NULL THEN (p.merged_at - p.created_at) / 3600.0 END) AS avg_lifetime,
         AVG(p.additions) AS avg_additions,
         AVG(p.deletions) AS avg_deletions,
         AVG(p.changed_files) AS avg_changed_files
       FROM pull_requests p
       JOIN repositories r ON p.repository_id = r.id
       WHERE r.owner_id = ? AND p.created_at >= ?
         AND p.author_login = (SELECT username FROM users WHERE id = ?)`,
    )
    .get(userId, Math.floor(start.getTime() / 1000), userId) as Record<
    string,
    unknown
  >;

  const total = Number(row.total ?? 0);
  const merged = Number(row.merged_count ?? 0);

  return {
    total,
    open: Number(row.open_count ?? 0),
    closed: Number(row.closed_count ?? 0),
    merged,
    mergeRate: total > 0 ? (merged / total) * 100 : 0,
    avgLifetimeHours:
      row.avg_lifetime !== null && row.avg_lifetime !== undefined
        ? Number(row.avg_lifetime)
        : null,
    avgAdditions:
      row.avg_additions !== null && row.avg_additions !== undefined
        ? Number(row.avg_additions)
        : null,
    avgDeletions:
      row.avg_deletions !== null && row.avg_deletions !== undefined
        ? Number(row.avg_deletions)
        : null,
    avgChangedFiles:
      row.avg_changed_files !== null && row.avg_changed_files !== undefined
        ? Number(row.avg_changed_files)
        : null,
  };
}
