import { sqlite } from "@/lib/db/client";
import { periodRange, type PeriodKey } from "@/lib/utils/period";

export interface LanguageStat {
  language: string;
  bytes: number;
  percentage: number;
  repositoryCount: number;
}

export async function getLanguageDistribution(
  userId: number,
): Promise<LanguageStat[]> {
  const rows = sqlite
    .prepare(
      `SELECT rl.language AS language, SUM(rl.bytes) AS bytes, COUNT(*) AS repos
       FROM repository_languages rl
       JOIN repositories r ON rl.repository_id = r.id
       WHERE r.owner_id = ?
       GROUP BY rl.language
       ORDER BY bytes DESC`,
    )
    .all(userId) as Array<{ language: string; bytes: number; repos: number }>;

  const total = rows.reduce((sum, row) => sum + row.bytes, 0);
  if (total === 0) return [];

  return rows.map((row) => ({
    language: row.language,
    bytes: row.bytes,
    percentage: (row.bytes / total) * 100,
    repositoryCount: Number(row.repos),
  }));
}

export interface CommitHourPoint {
  hour: number;
  count: number;
}

export type TimeBucketKey = "pagi" | "siang" | "sore" | "malam";

export interface TimeBucket {
  key: TimeBucketKey;
  label: string;
  range: string;
  count: number;
}

const BUCKETS: Omit<TimeBucket, "count">[] = [
  { key: "pagi", label: "Pagi", range: "06–11" },
  { key: "siang", label: "Siang", range: "12–17" },
  { key: "sore", label: "Sore", range: "18–23" },
  { key: "malam", label: "Malam", range: "00–05" },
];

function bucketForHour(hour: number): TimeBucketKey {
  if (hour >= 6 && hour < 12) return "pagi";
  if (hour >= 12 && hour < 18) return "siang";
  if (hour >= 18 && hour < 24) return "sore";
  return "malam";
}

export async function getCommitPatterns(
  userId: number,
  period: PeriodKey,
): Promise<{ byHour: CommitHourPoint[]; buckets: TimeBucket[]; avgSize: number | null }> {
  const { start } = periodRange(period);

  const hourRows = sqlite
    .prepare(
      `SELECT CAST(strftime('%H', committed_at, 'unixepoch') AS INTEGER) AS h, COUNT(*) AS n
       FROM commits c
       JOIN repositories r ON c.repository_id = r.id
       WHERE r.owner_id = ? AND c.committed_at >= ?
         AND c.author_login = (SELECT username FROM users WHERE id = ?)
       GROUP BY h`,
    )
    .all(userId, Math.floor(start.getTime() / 1000), userId) as Array<{
    h: number;
    n: number;
  }>;

  const countByHour = new Map(hourRows.map((row) => [Number(row.h), Number(row.n)]));
  const byHour: CommitHourPoint[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: countByHour.get(hour) ?? 0,
  }));

  const bucketTotals = new Map<TimeBucketKey, number>();
  for (const point of byHour) {
    const key = bucketForHour(point.hour);
    bucketTotals.set(key, (bucketTotals.get(key) ?? 0) + point.count);
  }
  const buckets: TimeBucket[] = BUCKETS.map((bucket) => ({
    ...bucket,
    count: bucketTotals.get(bucket.key) ?? 0,
  }));

  const sizeRow = sqlite
    .prepare(
      `SELECT AVG(c.additions + c.deletions) AS avg_size
       FROM commits c
       JOIN repositories r ON c.repository_id = r.id
       WHERE r.owner_id = ? AND c.additions IS NOT NULL AND c.deletions IS NOT NULL
         AND c.author_login = (SELECT username FROM users WHERE id = ?)`,
    )
    .get(userId, userId) as { avg_size: number | null };

  return {
    byHour,
    buckets,
    avgSize: sizeRow.avg_size !== null ? Number(sizeRow.avg_size) : null,
  };
}
