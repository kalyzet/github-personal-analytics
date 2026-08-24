import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { getOverview } from "../src/services/analytics/overview";
import { getTopRepositories, getRepositoryHealth } from "../src/services/analytics/repositories";
import { getLanguageDistribution, getCommitPatterns } from "../src/services/analytics/technologies";
import { getPullRequestStats } from "../src/services/analytics/pull-requests";
import { computeDeveloperScore } from "../src/services/analytics/developer-score";

async function main() {
  const userId = Number(process.argv[2] ?? 2);
  const period = "30d" as const;

  const overview = await getOverview(userId, period);
  console.log("=== OVERVIEW (30d) ===");
  console.log(
    `commits=${overview.commits} prs=${overview.pullRequests} issues=${overview.issues} reviews=${overview.reviews}`,
  );
  console.log(
    `activeDays=${overview.activeDays}/${overview.totalDays} streak=${overview.currentStreak} longest=${overview.longestStreak}`,
  );
  console.log(`mostActiveWeekday=${overview.mostActiveWeekday} weekendShare=${overview.weekendShare.toFixed(0)}%`);
  console.log("comparison:", overview.comparison.map((c) => `${c.label}: ${c.changePercent?.toFixed(1) ?? "n/a"}%`).join(" | "));

  const topRepos = await getTopRepositories(userId, period, 5);
  console.log("\n=== TOP REPOS ===");
  topRepos.forEach((r) =>
    console.log(`${r.name}: ${r.commits} commits (${r.sharePercent.toFixed(0)}%)`),
  );

  const languages = await getLanguageDistribution(userId);
  console.log("\n=== LANGUAGES ===");
  languages.slice(0, 5).forEach((l) =>
    console.log(`${l.language}: ${l.percentage.toFixed(1)}% (${l.repositoryCount} repos)`),
  );

  const [patterns, prStats, health] = await Promise.all([
    getCommitPatterns(userId, period),
    getPullRequestStats(userId, period),
    getRepositoryHealth(userId),
  ]);
  console.log("\n=== PATTERNS ===");
  console.log("buckets:", patterns.buckets.map((b) => `${b.label}:${b.count}`).join(" "));
  console.log(`avgSize=${patterns.avgSize?.toFixed(0)}`);

  console.log("\n=== PR STATS ===");
  console.log(`total=${prStats.total} merged=${prStats.merged} rate=${prStats.mergeRate.toFixed(0)}% lifetime=${prStats.avgLifetimeHours?.toFixed(1)}h`);

  const score = computeDeveloperScore(overview, prStats, languages, health);
  console.log("\n=== DEVELOPER SCORE ===");
  console.log(`score=${score.score}`);
  score.components.forEach((c) =>
    console.log(`${c.label}: ${c.value} (${c.weight}%)`),
  );

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
