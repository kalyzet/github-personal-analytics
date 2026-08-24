import { Card, CardTitle, EmptyState } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth/session";
import { getOverview } from "@/services/analytics/overview";
import { getTopRepositories } from "@/services/analytics/repositories";
import { parsePeriod } from "@/lib/utils/period";

export const dynamic = "force-dynamic";

interface GeneratedInsight {
  icon: string;
  title: string;
  description: string;
  tone: "positive" | "warning" | "info";
}

function formatPercent(value: number | null): string {
  if (value === null) return "n/a";
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
}

export default async function InsightsPage() {
  const session = await getSession();
  if (!session) return null;

  const period = parsePeriod("30d");
  const [overview, topRepos] = await Promise.all([
    getOverview(session.userId, period),
    getTopRepositories(session.userId, period, 1),
  ]);

  const insights: GeneratedInsight[] = [];

  for (const comparison of overview.comparison) {
    if (
      comparison.changePercent !== null &&
      Math.abs(comparison.changePercent) >= 20 &&
      (comparison.current > 0 || comparison.previous > 0)
    ) {
      insights.push({
        icon: comparison.changePercent >= 0 ? "↑" : "↓",
        title:
          comparison.changePercent >= 0
            ? `${comparison.label} meningkat`
            : `${comparison.label} menurun`,
        description: `${comparison.label} ${
          comparison.changePercent >= 0 ? "naik" : "turun"
        } ${Math.abs(comparison.changePercent).toFixed(0)}% dibandingkan periode sebelumnya (${formatPercent(comparison.changePercent)}).`,
        tone: comparison.changePercent >= 0 ? "positive" : "warning",
      });
    }
  }

  if (overview.currentStreak >= 3) {
    insights.push({
      icon: "🔥",
      title: `Streak ${overview.currentStreak} hari`,
      description: `Kamu aktif ${overview.currentStreak} hari berturut-turut. Rekor terpanjang kamu: ${overview.longestStreak} hari.`,
      tone: "positive",
    });
  }

  if (overview.mostActiveWeekday) {
    insights.push({
      icon: "📅",
      title: `Paling produktif di hari ${overview.mostActiveWeekday}`,
      description: `Hari ${overview.mostActiveWeekday} menjadi hari dengan aktivitas tertinggi dalam 30 hari terakhir. Aktivitas weekend: ${overview.weekendShare.toFixed(0)}%.`,
      tone: "info",
    });
  }

  if (topRepos[0] && topRepos[0].sharePercent >= 30) {
    insights.push({
      icon: "📦",
      title: `${topRepos[0].name} mendominasi perhatianmu`,
      description: `${topRepos[0].name} menyumbang ${topRepos[0].sharePercent.toFixed(0)}% commit pada periode ini (${topRepos[0].commits} commits).`,
      tone: "info",
    });
  }

  const tones = {
    positive: "border-positive/40 bg-positive/5 text-positive",
    warning: "border-warning/40 bg-warning/5 text-warning",
    info: "border-accent/40 bg-accent/5 text-accent",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Insights</h1>
        <p className="mt-0.5 text-xs text-text-muted">
          Insight otomatis dari perubahan data 30 hari terakhir.
        </p>
      </div>

      {insights.length === 0 ? (
        <Card>
          <EmptyState message="Belum cukup data untuk menghasilkan insight. Sync dan lanjutkan aktivitas beberapa hari lagi." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {insights.map((insight) => (
            <Card key={insight.title} className={tones[insight.tone]}>
              <CardTitle>
                {insight.icon} {insight.title}
              </CardTitle>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {insight.description}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
