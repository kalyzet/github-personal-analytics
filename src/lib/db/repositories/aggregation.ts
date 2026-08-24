import { eq } from "drizzle-orm";
import { db, sqlite } from "../client";
import { dailyActivity, repositoryActivity } from "../schema";

interface DayBucket {
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  releases: number;
  additions: number;
  deletions: number;
  activeRepositories: Set<number>;
}

interface RepoDayBucket {
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  releases: number;
  additions: number;
  deletions: number;
}

type CountRow = { d: string; rid: number; a?: number; dl?: number };

function all<T>(query: string, params: unknown[]): T[] {
  return sqlite.prepare(query).all(...(params as never[])) as T[];
}

function emptyDay(): DayBucket {
  return {
    commits: 0,
    pullRequests: 0,
    issues: 0,
    reviews: 0,
    releases: 0,
    additions: 0,
    deletions: 0,
    activeRepositories: new Set<number>(),
  };
}

export async function rebuildAggregations(
  userId: number,
  username: string,
): Promise<{ days: number; repoDays: number }> {
  const dayMap = new Map<string, DayBucket>();
  const repoDayMap = new Map<string, RepoDayBucket>();

  const repoIds = all<{ id: number }>(
    "SELECT id FROM repositories WHERE owner_id = ?",
    [userId],
  ).map((r) => Number(r.id));

  if (repoIds.length === 0) {
    await db.delete(dailyActivity).where(eq(dailyActivity.userId, userId));
    return { days: 0, repoDays: 0 };
  }

  const placeholders = repoIds.map(() => "?").join(",");
  const ownerFilter = [...repoIds, username];

  function collect(
    rows: CountRow[],
    kind: "commits" | "pullRequests" | "issues" | "reviews" | "releases",
    withStats = false,
  ) {
    for (const row of rows) {
      const date = String(row.d);
      const bucket = dayMap.get(date) ?? emptyDay();
      bucket[kind] += 1;
      if (withStats) {
        bucket.additions += row.a ?? 0;
        bucket.deletions += row.dl ?? 0;
      }
      bucket.activeRepositories.add(Number(row.rid));
      dayMap.set(date, bucket);

      const key = `${row.rid}:${date}`;
      const repoBucket =
        repoDayMap.get(key) ?? {
          commits: 0,
          pullRequests: 0,
          issues: 0,
          reviews: 0,
          releases: 0,
          additions: 0,
          deletions: 0,
        };
      repoBucket[kind] += 1;
      if (withStats) {
        repoBucket.additions += row.a ?? 0;
        repoBucket.deletions += row.dl ?? 0;
      }
      repoDayMap.set(key, repoBucket);
    }
  }

  collect(
    all<CountRow>(
      `SELECT date(c.committed_at, 'unixepoch') AS d, c.repository_id AS rid,
              COALESCE(c.additions, 0) AS a, COALESCE(c.deletions, 0) AS dl
       FROM commits c
       WHERE c.repository_id IN (${placeholders}) AND c.author_login = ?`,
      ownerFilter,
    ),
    "commits",
    true,
  );

  collect(
    all<CountRow>(
      `SELECT date(created_at, 'unixepoch') AS d, repository_id AS rid
       FROM pull_requests
       WHERE repository_id IN (${placeholders}) AND author_login = ?`,
      ownerFilter,
    ),
    "pullRequests",
  );

  collect(
    all<CountRow>(
      `SELECT date(created_at, 'unixepoch') AS d, repository_id AS rid
       FROM issues
       WHERE repository_id IN (${placeholders}) AND author_login = ?
         AND is_pull_request = 0`,
      ownerFilter,
    ),
    "issues",
  );

  collect(
    all<CountRow>(
      `SELECT date(prr.submitted_at, 'unixepoch') AS d, p.repository_id AS rid
       FROM pull_request_reviews prr
       JOIN pull_requests p ON prr.pull_request_id = p.id
       WHERE p.repository_id IN (${placeholders}) AND prr.reviewer_login = ?
         AND prr.submitted_at IS NOT NULL`,
      ownerFilter,
    ),
    "reviews",
  );

  collect(
    all<CountRow>(
      `SELECT date(published_at, 'unixepoch') AS d, repository_id AS rid
       FROM releases
       WHERE repository_id IN (${placeholders}) AND author_login = ?
         AND published_at IS NOT NULL`,
      ownerFilter,
    ),
    "releases",
  );

  const insertDaily = sqlite.prepare(
    `INSERT INTO daily_activity
       (user_id, date, commits, pull_requests, issues, reviews, releases,
        additions, deletions, active_repositories, total_activity, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
  );

  const insertRepoActivity = sqlite.prepare(
    `INSERT INTO repository_activity
       (repository_id, date, commits, pull_requests, issues, reviews, releases,
        additions, deletions, total_activity, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
  );

  sqlite.exec("BEGIN TRANSACTION");
  try {
    await db.delete(dailyActivity).where(eq(dailyActivity.userId, userId));
    await db.delete(repositoryActivity);

    for (const [date, b] of dayMap) {
      insertDaily.run(
        userId,
        date,
        b.commits,
        b.pullRequests,
        b.issues,
        b.reviews,
        b.releases,
        b.additions,
        b.deletions,
        b.activeRepositories.size,
        b.commits + b.pullRequests + b.issues + b.reviews + b.releases,
      );
    }

    for (const [key, b] of repoDayMap) {
      const separatorIndex = key.indexOf(":");
      const repositoryId = Number(key.slice(0, separatorIndex));
      const date = key.slice(separatorIndex + 1);
      insertRepoActivity.run(
        repositoryId,
        date,
        b.commits,
        b.pullRequests,
        b.issues,
        b.reviews,
        b.releases,
        b.additions,
        b.deletions,
        b.commits + b.pullRequests + b.issues + b.reviews + b.releases,
      );
    }

    sqlite.exec("COMMIT");
  } catch (error) {
    sqlite.exec("ROLLBACK");
    throw error;
  }

  return { days: dayMap.size, repoDays: repoDayMap.size };
}
