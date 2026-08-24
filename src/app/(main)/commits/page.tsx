import HourBarChart from "@/components/charts/hour-bar-chart";
import TrendChart from "@/components/charts/trend-chart";
import PeriodSelector from "@/components/ui/period-selector";
import { Card, CardTitle, EmptyState, MetricCard } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth/session";
import {
  getCommitPatterns,
} from "@/services/analytics/technologies";
import { getDailySeries } from "@/services/analytics/overview";
import { parsePeriod } from "@/lib/utils/period";

export const dynamic = "force-dynamic";

export default async function CommitsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const period = parsePeriod((await searchParams).period);
  const [series, patterns] = await Promise.all([
    getDailySeries(session.userId, period),
    getCommitPatterns(session.userId, period),
  ]);

  const totalCommits = series.reduce((sum, point) => sum + point.commits, 0);
  const totalAdditions = series.reduce((sum, point) => sum + point.additions, 0);
  const totalDeletions = series.reduce((sum, point) => sum + point.deletions, 0);

  const trendPoints = series.map((point) => ({
    date: point.date,
    label: new Date(`${point.date}T00:00:00Z`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }),
    value: point.commits,
  }));

  const hourPoints = patterns.byHour.map((point) => ({
    label: `${String(point.hour).padStart(2, "0")}`,
    count: point.count,
  }));

  const busiestBucket = [...patterns.buckets].sort(
    (a, b) => b.count - a.count,
  )[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Commits</h1>
        <PeriodSelector />
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Commits"
          value={totalCommits.toLocaleString("id-ID")}
          hint={`${(totalCommits / series.length).toFixed(1)} / hari`}
        />
        <MetricCard
          label="Additions"
          value={`+${totalAdditions.toLocaleString("id-ID")}`}
          hint="total baris ditambahkan"
        />
        <MetricCard
          label="Deletions"
          value={`−${totalDeletions.toLocaleString("id-ID")}`}
          hint="total baris dihapus"
        />
        <MetricCard
          label="Rata-rata Ukuran Commit"
          value={
            patterns.avgSize !== null ? Math.round(patterns.avgSize) : "-"
          }
          hint="baris per commit"
        />
      </section>

      <Card>
        <CardTitle>Commit Trend</CardTitle>
        <div className="mt-4">
          {totalCommits === 0 ? (
            <EmptyState message="Belum ada commit pada periode ini." />
          ) : (
            <TrendChart data={trendPoints} color="#22C55E" />
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardTitle>Commit Time (per jam)</CardTitle>
          <div className="mt-4">
            <HourBarChart data={hourPoints} />
          </div>
        </Card>

        <Card>
          <CardTitle>Distribusi Waktu</CardTitle>
          <ul className="mt-4 space-y-3">
            {patterns.buckets.map((bucket) => {
              const total =
                patterns.buckets.reduce((sum, b) => sum + b.count, 0) || 1;
              return (
                <li key={bucket.key}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="text-text-secondary">
                      {bucket.label}
                      <span className="ml-1.5 text-xs text-text-muted">
                        {bucket.range}
                        {busiestBucket?.key === bucket.key ? " · paling aktif" : ""}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-text-muted">
                      {bucket.count}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-cyan-accent transition-all duration-200"
                      style={{
                        width: `${(bucket.count / total) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
