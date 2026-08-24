import { and, eq, gte } from "drizzle-orm";
import { db, sqlite } from "@/lib/db/client";
import { dailyActivity } from "@/lib/db/schema";
import {
  periodRange,
  previousRange,
  toDateString,
  type PeriodKey,
} from "@/lib/utils/period";

export interface ActivityTotals {
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  releases: number;
  additions: number;
  deletions: number;
  totalActivity: number;
}

const EMPTY_TOTALS: ActivityTotals = {
  commits: 0,
  pullRequests: 0,
  issues: 0,
  reviews: 0,
  releases: 0,
  additions: 0,
  deletions: 0,
  totalActivity: 0,
};

function sumTotals(rows: Array<Record<string, unknown>>): ActivityTotals {
  return rows.reduce<ActivityTotals>(
    (acc, row) => ({
      commits: acc.commits + Number(row.commits),
      pullRequests: acc.pullRequests + Number(row.pull_requests),
      issues: acc.issues + Number(row.issues),
      reviews: acc.reviews + Number(row.reviews),
      releases: acc.releases + Number(row.releases),
      additions: acc.additions + Number(row.additions),
      deletions: acc.deletions + Number(row.deletions),
      totalActivity: acc.totalActivity + Number(row.total_activity),
    }),
    { ...EMPTY_TOTALS },
  );
}

export interface DayActivityPoint {
  date: string;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  releases: number;
  additions: number;
  deletions: number;
  total: number;
}

export async function getDailySeries(
  userId: number,
  period: PeriodKey,
): Promise<DayActivityPoint[]> {
  const { start, days } = periodRange(period);

  const rows = await db
    .select()
    .from(dailyActivity)
    .where(
      and(eq(dailyActivity.userId, userId), gte(dailyActivity.date, toDateString(start))),
    );

  const byDate = new Map(rows.map((row) => [row.date, row]));

  const series: DayActivityPoint[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < days; i++) {
    const key = toDateString(cursor);
    const row = byDate.get(key);
    series.push({
      date: key,
      commits: row?.commits ?? 0,
      pullRequests: row?.pullRequests ?? 0,
      issues: row?.issues ?? 0,
      reviews: row?.reviews ?? 0,
      releases: row?.releases ?? 0,
      additions: row?.additions ?? 0,
      deletions: row?.deletions ?? 0,
      total:
        (row?.totalActivity ??
          (row?.commits ?? 0) +
            (row?.pullRequests ?? 0) +
            (row?.issues ?? 0) +
            (row?.reviews ?? 0) +
            (row?.releases ?? 0)),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
}

function computeStreaks(dates: string[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const sorted = [...new Set(dates)].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    prev.setDate(prev.getDate() + 1);
    if (toDateString(prev) === sorted[i]) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateSet = new Set(sorted);
  let current = 0;
  const cursor = new Date(today);
  if (!dateSet.has(toDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dateSet.has(toDateString(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { currentStreak: current, longestStreak: longest };
}

export interface OverviewData extends ActivityTotals {
  totalDays: number;
  activeDays: number;
  activeDayRatio: number;
  avgPerDay: number;
  weekendShare: number;
  mostActiveWeekday: string | null;
  currentStreak: number;
  longestStreak: number;
  comparison: {
    metric: string;
    label: string;
    current: number;
    previous: number;
    changePercent: number | null;
  }[];
}

const WEEKDAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

async function getTotalsForRange(
  userId: number,
  range: { start: Date; end: Date },
): Promise<{ totals: ActivityTotals; activeDates: string[] }> {
  const rows = sqlite
    .prepare(
      `SELECT commits, pull_requests, issues, reviews, releases, additions, deletions, total_activity
       FROM daily_activity WHERE user_id = ? AND date >= ? AND date <= ?`,
    )
    .all(
      userId,
      toDateString(range.start),
      toDateString(range.end),
    ) as Array<Record<string, unknown>>;

  const activeDates = await db
    .select({ date: dailyActivity.date })
    .from(dailyActivity)
    .where(
      and(
        eq(dailyActivity.userId, userId),
        gte(dailyActivity.totalActivity, 1),
        gte(dailyActivity.date, toDateString(range.start)),
      ),
    );

  return { totals: sumTotals(rows), activeDates: activeDates.map((r) => r.date) };
}

export async function getOverview(
  userId: number,
  period: PeriodKey,
): Promise<OverviewData> {
  const range = periodRange(period);
  const prevRange = previousRange(period);

  const [{ totals }, prev] = await Promise.all([
    getTotalsForRange(userId, range),
    getTotalsForRange(userId, prevRange),
  ]);

  const allDates = (
    sqlite
      .prepare("SELECT date FROM daily_activity WHERE user_id = ? AND total_activity > 0")
      .all(userId) as Array<{ date: string }>
  ).map((r) => r.date);

  const { currentStreak, longestStreak } = computeStreaks(allDates);

  const weekdayCounts = new Map<string, number>();
  let weekendCount = 0;
  const series = await getDailySeries(userId, period);
  for (const point of series) {
    if (point.total === 0) continue;
    const weekday = WEEKDAY_NAMES[new Date(`${point.date}T00:00:00Z`).getUTCDay()];
    weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + point.total);
    if (weekday === "Sabtu" || weekday === "Minggu") {
      weekendCount += point.total;
    }
  }
  const mostActiveWeekday =
    weekdayCounts.size > 0
      ? [...weekdayCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;

  const activeDays = new Set(series.filter((p) => p.total > 0).map((p) => p.date))
    .size;

  function change(current: number, previous: number): number | null {
    if (previous === 0 && current === 0) return 0;
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }

  return {
    ...totals,
    totalDays: range.days,
    activeDays,
    activeDayRatio: (activeDays / range.days) * 100,
    avgPerDay: totals.totalActivity / range.days,
    weekendShare:
      totals.totalActivity > 0
        ? (weekendCount / totals.totalActivity) * 100
        : 0,
    mostActiveWeekday,
    currentStreak,
    longestStreak,
    comparison: [
      ["commits", "Commits", totals.commits, prev.totals.commits],
      ["pullRequests", "Pull Requests", totals.pullRequests, prev.totals.pullRequests],
      ["issues", "Issues", totals.issues, prev.totals.issues],
      ["reviews", "Reviews", totals.reviews, prev.totals.reviews],
      [
        "activeDays",
        "Hari Aktif",
        activeDays,
        new Set(prev.activeDates).size,
      ],
    ].map(([metric, label, current, previous]) => ({
      metric: metric as string,
      label: label as string,
      current: current as number,
      previous: previous as number,
      changePercent: change(current as number, previous as number),
    })),
  };
}
