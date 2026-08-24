import Link from "next/link";
import PeriodSelector from "@/components/ui/period-selector";
import {
  Card,
  CardTitle,
  EmptyState,
  MetricCard,
  ProgressBar,
  StatusBadge,
} from "@/components/ui/primitives";
import { getSession } from "@/lib/auth/session";
import {
  getRepositoryHealth,
  getTopRepositories,
} from "@/services/analytics/repositories";
import { parsePeriod, periodRange } from "@/lib/utils/period";

export const dynamic = "force-dynamic";

function repoStatus(repo: {
  isArchived: boolean;
  commits: number;
  totalActivity: number;
}): { label: string; tone: string } {
  if (repo.isArchived) return { label: "Archived", tone: "muted" };
  if (repo.commits > 0) return { label: "Active", tone: "positive" };
  if (repo.totalActivity > 0) return { label: "Low Activity", tone: "warning" };
  return { label: "Inactive", tone: "muted" };
}

export default async function RepositoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const period = parsePeriod((await searchParams).period);
  void periodRange;

  const [topRepos, health] = await Promise.all([
    getTopRepositories(session.userId, period, 50),
    getRepositoryHealth(session.userId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Repositories</h1>
        <PeriodSelector />
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Repos" value={health.total} />
        <MetricCard
          label="Aktif (90 hari)"
          value={health.activeRepos}
          hint="ada push dalam 90 hari terakhir"
        />
        <MetricCard label="Archived" value={health.archived} />
        <MetricCard
          label="Total Stars"
          value={topRepos.reduce((sum, repo) => sum + repo.stars, 0)}
        />
      </section>

      <Card>
        <CardTitle>Distribusi Aktivitas</CardTitle>
        <div className="mt-4">
          {topRepos.length === 0 ? (
            <EmptyState message="Belum ada repository. Jalankan sync dulu." />
          ) : (
            <ul className="space-y-4">
              {topRepos.map((repo) => {
                const status = repoStatus(repo);
                return (
                  <li key={repo.id}>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link
                          href={`https://github.com/${repo.fullName}`}
                          target="_blank"
                          className="truncate font-mono text-sm font-medium text-text-primary hover:text-accent"
                        >
                          {repo.name}
                        </Link>
                        <StatusBadge label={status.label} tone={status.tone} />
                        {repo.isFork && (
                          <StatusBadge label="Fork" tone="accent" />
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-text-muted">
                        {repo.primaryLanguage ?? "—"} · ⭐{" "}
                        {repo.stars.toLocaleString("id-ID")} ·{" "}
                        <span className="font-mono">{repo.commits}</span> commits
                      </span>
                    </div>
                    <ProgressBar
                      percent={
                        repo.sharePercent ||
                        Math.min(
                          100,
                          (repo.totalActivity /
                            Math.max(1, topRepos[0]?.totalActivity || 1)) *
                            100,
                        )
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
