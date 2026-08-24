import type { OverviewData } from "./overview";
import type { PullRequestStats } from "./pull-requests";
import type { LanguageStat } from "./technologies";

export interface ScoreComponent {
  key: string;
  label: string;
  value: number;
  weight: number;
  description: string;
}

export interface DeveloperScore {
  score: number;
  components: ScoreComponent[];
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export interface RepoHealth {
  total: number;
  activeRepos: number;
  archived: number;
}

export function computeDeveloperScore(
  overview: OverviewData,
  prStats: PullRequestStats,
  languages: LanguageStat[],
  repoHealth: RepoHealth,
): DeveloperScore {
  const activity = clamp(
    (overview.avgPerDay / 3) * 100,
  );

  const consistency = clamp(overview.activeDayRatio);

  const collaborationActions =
    overview.pullRequests + overview.reviews + overview.issues;
  const collaboration = clamp((collaborationActions / overview.totalDays) * 250);

  const projectFocus = clamp(
    repoHealth.total > 0
      ? (repoHealth.activeRepos / repoHealth.total) * 100
      : 0,
  );

  const technologyDiversity = clamp(
    (Math.min(languages.length, 6) / 6) * 100,
  );

  const maintenance = clamp(
    (prStats.mergeRate || 0) * 0.7 +
      (overview.releases > 0 ? 30 : 0),
  );

  const rawComponents: Omit<ScoreComponent, "weight">[] = [
    {
      key: "activity",
      label: "Activity",
      value: Math.round(activity),
      description:
        "Volume aktivitas harian relatif terhadap target rata-rata 3 aktivitas/hari.",
    },
    {
      key: "consistency",
      label: "Consistency",
      value: Math.round(consistency),
      description: `Persentase hari aktif dalam periode (${overview.activeDays}/${overview.totalDays} hari).`,
    },
    {
      key: "collaboration",
      label: "Collaboration",
      value: Math.round(collaboration),
      description: "Frekuensi PR, review, dan issue yang kamu buat.",
    },
    {
      key: "projects",
      label: "Project Health",
      value: Math.round(projectFocus),
      description: `${repoHealth.activeRepos}/${repoHealth.total} repo masih aktif dalam 90 hari terakhir.`,
    },
    {
      key: "technology",
      label: "Technology",
      value: Math.round(technologyDiversity),
      description: `Keberagaman bahasa (${languages.length} bahasa terdeteksi).`,
    },
    {
      key: "maintenance",
      label: "Maintenance",
      value: Math.round(maintenance),
      description: "Merge rate PR dan aktivitas rilis.",
    },
  ];

  const weights: Record<string, number> = {
    activity: 25,
    consistency: 20,
    collaboration: 20,
    projects: 15,
    technology: 10,
    maintenance: 10,
  };

  const components = rawComponents.map((component) => ({
    ...component,
    weight: weights[component.key] ?? 0,
  }));

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const weighted = components.reduce(
    (sum, c) => sum + c.value * c.weight,
    0,
  );
  const score =
    totalWeight > 0 ? Math.round(weighted / totalWeight) : 0;

  return { score, components };
}
