import PeriodSelector from "@/components/ui/period-selector";
import {
  Card,
  CardTitle,
  EmptyState,
  MetricCard,
  ProgressBar,
} from "@/components/ui/primitives";
import { getSession } from "@/lib/auth/session";
import { getPullRequestStats } from "@/services/analytics/pull-requests";
import { parsePeriod } from "@/lib/utils/period";

export const dynamic = "force-dynamic";

function formatLifetime(hours: number | null): string {
  if (hours === null) return "-";
  if (hours < 24) return `${hours.toFixed(1)} jam`;
  return `${(hours / 24).toFixed(1)} hari`;
}

export default async function PullRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const period = parsePeriod((await searchParams).period);
  const stats = await getPullRequestStats(session.userId, period);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Pull Requests</h1>
        <PeriodSelector />
      </div>

      {stats.total === 0 ? (
        <Card>
          <EmptyState message="Belum ada Pull Request pada periode ini." />
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              label="Total PR"
              value={stats.total.toLocaleString("id-ID")}
              hint={`${stats.open} open · ${stats.closed} closed`}
            />
            <MetricCard
              label="Merged"
              value={stats.merged.toLocaleString("id-ID")}
              hint={`${stats.total - stats.merged} belum merged`}
            />
            <MetricCard
              label="Merge Rate"
              value={`${stats.mergeRate.toFixed(0)}%`}
              hint="dari seluruh PR periode ini"
            />
            <MetricCard
              label="Rata-rata Lifetime"
              value={formatLifetime(stats.avgLifetimeHours)}
              hint="waktu sampai merged"
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle>PR Merge Rate</CardTitle>
              <div className="mt-6 space-y-2">
                <p className="font-mono text-4xl font-bold text-positive">
                  {stats.mergeRate.toFixed(0)}%
                </p>
                <ProgressBar percent={stats.mergeRate} color="bg-positive" />
                <p className="pt-1 text-xs text-text-muted">
                  {stats.merged} dari {stats.total} PR berhasil di-merge.
                </p>
              </div>
            </Card>

            <Card>
              <CardTitle>Ukuran PR Rata-rata</CardTitle>
              <dl className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <dt className="text-xs text-text-muted">Additions</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-positive">
                    +{Math.round(stats.avgAdditions ?? 0).toLocaleString("id-ID")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Deletions</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-danger">
                    −{Math.round(stats.avgDeletions ?? 0).toLocaleString("id-ID")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Files</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold">
                    {Math.round(stats.avgChangedFiles ?? 0)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-text-muted">
                Ukuran rata-rata membantu melihat kebiasaan: PR kecil dan fokus
                biasanya lebih mudah direview.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
