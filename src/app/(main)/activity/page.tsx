import ActivityHeatmap from "@/components/charts/activity-heatmap";
import TrendChart from "@/components/charts/trend-chart";
import PeriodSelector from "@/components/ui/period-selector";
import { Card, CardTitle } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth/session";
import { getDailySeries, getOverview } from "@/services/analytics/overview";
import { parsePeriod } from "@/lib/utils/period";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const period = parsePeriod((await searchParams).period);
  const [series, overview] = await Promise.all([
    getDailySeries(session.userId, period),
    getOverview(session.userId, period),
  ]);

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

  const breakdown = [
    { label: "Commits", value: overview.commits },
    { label: "Pull Requests", value: overview.pullRequests },
    { label: "Issues", value: overview.issues },
    { label: "Reviews", value: overview.reviews },
    { label: "Releases", value: overview.releases },
  ];
  const breakdownTotal =
    breakdown.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Activity</h1>
        <PeriodSelector />
      </div>

      <Card>
        <CardTitle>Activity Timeline</CardTitle>
        <div className="mt-4">
          <TrendChart data={trendPoints} />
        </div>
      </Card>

      <Card>
        <CardTitle>Activity Heatmap</CardTitle>
        <div className="mt-4">
          <ActivityHeatmap points={heatPoints} />
        </div>
      </Card>

      <Card>
        <CardTitle>Activity Breakdown</CardTitle>
        <ul className="mt-4 space-y-3">
          {breakdown.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between rounded-lg bg-surface-elevated px-4 py-3"
            >
              <span className="text-sm text-text-secondary">{item.label}</span>
              <span className="font-mono text-sm">
                {item.value.toLocaleString("id-ID")}
                <span className="ml-2 text-xs text-text-muted">
                  ({((item.value / breakdownTotal) * 100).toFixed(0)}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
