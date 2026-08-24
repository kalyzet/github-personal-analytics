import Link from "next/link";
import ActivityHeatmap from "@/components/charts/activity-heatmap";
import TrendChart from "@/components/charts/trend-chart";
import BarList from "@/components/ui/bar-list";
import PeriodSelector from "@/components/ui/period-selector";
import {
  Card,
  CardTitle,
  EmptyState,
  MetricCard,
  ProgressBar,
} from "@/components/ui/primitives";
import { getSession } from "@/lib/auth/session";
import { getLatestSyncJob } from "@/lib/db/repositories/sync";
import { formatRelative } from "@/lib/utils/format";
import { getDailySeries, getOverview } from "@/services/analytics/overview";
import { computeDeveloperScore } from "@/services/analytics/developer-score";
import { getPullRequestStats } from "@/services/analytics/pull-requests";
import {
  getRepositoryHealth,
  getTopRepositories,
} from "@/services/analytics/repositories";
import { getLanguageDistribution } from "@/services/analytics/technologies";
import { parsePeriod } from "@/lib/utils/period";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const period = parsePeriod((await searchParams).period);

  const [overview, topRepos, languages, prStats, repoHealth, syncJob, series] =
    await Promise.all([
      getOverview(session.userId, period),
      getTopRepositories(session.userId, period, 5),
      getLanguageDistribution(session.userId),
      getPullRequestStats(session.userId, period),
      getRepositoryHealth(session.userId),
      getLatestSyncJob(session.userId),
      getDailySeries(session.userId, period),
    ]);

  const developerScore = computeDeveloperScore(
    overview,
    prStats,
    languages,
    repoHealth,
  );

  const hasData = overview.totalActivity > 0 || topRepos.length > 0;
  const heatPoints = series.map((point) => ({
    date: point.date,
    total: point.total,
  }));
  const trendPoints = series.map((point) => ({
    date: point.date,
    label: new Date(`${point.date}T00:00:00Z`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }),
    value: point.total,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-xs text-text-muted">
            Last sync: {formatRelative(syncJob?.startedAt ?? null)}
          </p>
        </div>
        <PeriodSelector />
      </div>

      {!hasData ? (
        <Card>
          <EmptyState message="Belum ada data aktivitas. Jalankan Sync dari menu Sync untuk mengumpulkan data GitHub kamu." />
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <MetricCard
              label="Commits"
              value={overview.commits.toLocaleString("id-ID")}
              changePercent={
                overview.comparison.find((c) => c.metric === "commits")
                  ?.changePercent
              }
            />
            <MetricCard
              label="Pull Requests"
              value={overview.pullRequests.toLocaleString("id-ID")}
              changePercent={
                overview.comparison.find((c) => c.metric === "pullRequests")
                  ?.changePercent
              }
            />
            <MetricCard
              label="Issues"
              value={overview.issues.toLocaleString("id-ID")}
              changePercent={
                overview.comparison.find((c) => c.metric === "issues")
                  ?.changePercent
              }
            />
            <MetricCard
              label="Hari Aktif"
              value={`${overview.activeDays}/${overview.totalDays}`}
              hint={`${overview.activeDayRatio.toFixed(0)}% dari periode`}
            />
            <MetricCard
              label="Streak"
              value={overview.currentStreak}
              hint={`Terpanjang: ${overview.longestStreak} hari`}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardTitle>Activity Heatmap</CardTitle>
              <div className="mt-4">
                <ActivityHeatmap points={heatPoints} />
              </div>
            </Card>

            <Card className="flex flex-col">
              <CardTitle>Developer Score</CardTitle>
              <div className="mt-3 text-center">
                <p className="font-mono text-5xl font-bold text-accent">
                  {developerScore.score}
                </p>
                <p className="text-xs text-text-muted">/ 100</p>
              </div>
              <ul className="mt-5 space-y-2.5">
                {developerScore.components.map((component) => (
                  <li key={component.key}>
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span title={component.description} className="cursor-help text-text-secondary">
                        {component.label}
                        <span className="ml-1 text-text-muted">
                          ({component.weight}%)
                        </span>
                      </span>
                      <span className="font-mono">{component.value}</span>
                    </div>
                    <ProgressBar percent={component.value} />
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-4 text-[10px] leading-relaxed text-text-muted">
                Score adalah indikator aktivitas berdasarkan histori GitHub,
                bukan ukuran kemampuan programming.
              </p>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardTitle>Activity Trend</CardTitle>
              <div className="mt-4">
                <TrendChart data={trendPoints} />
              </div>
            </Card>

            <Card>
              <CardTitle>Languages</CardTitle>
              <div className="mt-4">
                {languages.length === 0 ? (
                  <EmptyState message="Belum ada data bahasa." />
                ) : (
                  <BarList
                    items={languages.slice(0, 6).map((lang) => ({
                      label: lang.language,
                      value: `${lang.percentage.toFixed(1)}%`,
                      percent: lang.percentage,
                      hint: `${lang.repositoryCount} repo`,
                    }))}
                    color="bg-cyan-accent"
                  />
                )}
              </div>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between">
                <CardTitle>Top Repositories</CardTitle>
                <Link
                  href="/repositories"
                  className="text-xs text-text-muted hover:text-accent"
                >
                  Lihat semua →
                </Link>
              </div>
              <div className="mt-4">
                {topRepos.length === 0 ? (
                  <EmptyState message="Belum ada repository." />
                ) : (
                  <ol className="space-y-3.5">
                    {topRepos.map((repo, index) => (
                      <li key={repo.id}>
                        <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate font-mono text-xs">
                            <span className="text-text-muted">
                              {String(index + 1).padStart(2, "0")}{" "}
                            </span>
                            <span className="text-text-primary">{repo.name}</span>
                          </span>
                          <span className="shrink-0 font-mono text-xs text-text-muted">
                            {repo.commits} commits ·{" "}
                            {repo.sharePercent.toFixed(0)}%
                          </span>
                        </div>
                        <ProgressBar percent={repo.sharePercent} />
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </Card>

            <Card>
              <CardTitle>Coding Pattern</CardTitle>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs text-text-muted">Hari paling aktif</dt>
                  <dd className="mt-0.5 font-medium">
                    {overview.mostActiveWeekday ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Rata-rata aktivitas</dt>
                  <dd className="mt-0.5 font-mono">
                    {overview.avgPerDay.toFixed(1)} / hari
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Aktivitas weekend</dt>
                  <dd className="mt-0.5 font-mono">
                    {overview.weekendShare.toFixed(0)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">PR merge rate</dt>
                  <dd className="mt-0.5 font-mono">
                    {prStats.total > 0 ? `${prStats.mergeRate.toFixed(0)}%` : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Additions</dt>
                  <dd className="mt-0.5 font-mono text-positive">
                    +{overview.additions.toLocaleString("id-ID")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Deletions</dt>
                  <dd className="mt-0.5 font-mono text-danger">
                    −{overview.deletions.toLocaleString("id-ID")}
                  </dd>
                </div>
              </dl>
            </Card>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {overview.comparison.map((item) => (
              <MetricCard
                key={item.metric}
                label={item.label}
                value={item.current.toLocaleString("id-ID")}
                changePercent={item.changePercent}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
