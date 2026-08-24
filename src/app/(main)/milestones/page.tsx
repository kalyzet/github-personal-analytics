import { sqlite } from "@/lib/db/client";
import { Card, CardTitle, EmptyState } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

interface Milestone {
  icon: string;
  label: string;
  target: number;
  current: number;
  unit: string;
}

export default async function MilestonesPage() {
  const session = await getSession();
  if (!session) return null;

  const stats = sqlite
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM commits c JOIN repositories r ON c.repository_id = r.id
           WHERE r.owner_id = ? AND c.author_login = ?) AS commits,
         (SELECT COUNT(*) FROM repositories WHERE owner_id = ?) AS repos,
         (SELECT COALESCE(SUM(stars), 0) FROM repositories WHERE owner_id = ?) AS stars,
         (SELECT MAX(longest_streak) FROM (
            SELECT COUNT(*) AS longest_streak FROM (
              SELECT date, date - ROW_NUMBER() OVER (ORDER BY date) AS grp
              FROM daily_activity WHERE user_id = ? AND total_activity > 0
            ) GROUP BY grp
         )) AS longest_streak`,
    )
    .get(
      session.userId,
      session.username.toLowerCase(),
      session.userId,
      session.userId,
      session.userId,
    ) as {
    commits: number;
    repos: number;
    stars: number;
    longest_streak: number | null;
  };

  const commitTargets = [100, 250, 500, 1000, 2500, 5000];
  const streakTargets = [7, 30, 50, 100];
  const repoTargets = [10, 25, 50];
  const starTargets = [10, 100, 500];

  const milestones: Milestone[] = [
    ...commitTargets.map((target) => ({
      icon: "🎯",
      label: `${target.toLocaleString("id-ID")} Commits`,
      target,
      current: Number(stats.commits),
      unit: "commits",
    })),
    ...streakTargets.map((target) => ({
      icon: "🔥",
      label: `${target} Day Streak`,
      target,
      current: Number(stats.longest_streak ?? 0),
      unit: "hari",
    })),
    ...repoTargets.map((target) => ({
      icon: "📦",
      label: `${target} Repositories`,
      target,
      current: Number(stats.repos),
      unit: "repos",
    })),
    ...starTargets.map((target) => ({
      icon: "⭐",
      label: `${target} Stars`,
      target,
      current: Number(stats.stars),
      unit: "stars",
    })),
  ];

  const sorted = milestones.sort(
    (a, b) => a.current / a.target - b.current / b.target,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Milestones</h1>
        <p className="mt-0.5 text-xs text-text-muted">
          Target pencapaian berdasarkan histori GitHub kamu.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-accent/40 bg-accent/5">
          <CardTitle>Berikutnya tercapai</CardTitle>
          {sorted[0] && (
            <>
              <p className="mt-3 text-2xl">{sorted[0].icon} {sorted[0].label}</p>
              <p className="mt-1 font-mono text-sm text-text-secondary">
                {sorted[0].current.toLocaleString("id-ID")} /{" "}
                {sorted[0].target.toLocaleString("id-ID")}{" "}
                {sorted[0].unit}
              </p>
            </>
          )}
        </Card>

        {milestones.map((milestone) => {
          const achieved = milestone.current >= milestone.target;
          const percent = Math.min(
            100,
            (milestone.current / milestone.target) * 100,
          );
          return (
            <Card
              key={milestone.label}
              className={achieved ? "border-positive/40" : ""}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{milestone.icon}</span>
                {achieved && (
                  <span className="text-xs font-medium text-positive">
                    ✓ Tercapai
                  </span>
                )}
              </div>
              <p className="mt-2 font-medium">{milestone.label}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    achieved ? "bg-positive" : "bg-accent"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1.5 font-mono text-xs text-text-muted">
                {milestone.current.toLocaleString("id-ID")} /{" "}
                {milestone.target.toLocaleString("id-ID")} ({percent.toFixed(0)}
                %)
              </p>
            </Card>
          );
        })}
      </div>

      {Number(stats.commits) === 0 && (
        <Card>
          <EmptyState message="Belum ada data untuk menghitung milestone." />
        </Card>
      )}
    </div>
  );
}
