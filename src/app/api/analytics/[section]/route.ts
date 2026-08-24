import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getCommitPatterns,
  getLanguageDistribution,
} from "@/services/analytics/technologies";
import { getOverview } from "@/services/analytics/overview";
import { getPullRequestStats } from "@/services/analytics/pull-requests";
import {
  getRepositoryHealth,
  getTopRepositories,
} from "@/services/analytics/repositories";
import { computeDeveloperScore } from "@/services/analytics/developer-score";
import { parsePeriod } from "@/lib/utils/period";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ section: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { section } = await context.params;
  const period = parsePeriod(
    new URL(request.url).searchParams.get("period") ?? undefined,
  );

  try {
    switch (section) {
      case "overview":
        return NextResponse.json(await getOverview(session.userId, period));
      case "activity": {
        const { getDailySeries } = await import(
          "@/services/analytics/overview"
        );
        return NextResponse.json(await getDailySeries(session.userId, period));
      }
      case "commits": {
        const [patterns, overview] = await Promise.all([
          getCommitPatterns(session.userId, period),
          getOverview(session.userId, period),
        ]);
        return NextResponse.json({ ...patterns, overview });
      }
      case "pull-requests":
        return NextResponse.json(
          await getPullRequestStats(session.userId, period),
        );
      case "repositories":
        return NextResponse.json({
          top: await getTopRepositories(session.userId, period, 15),
          health: await getRepositoryHealth(session.userId),
        });
      case "technologies":
        return NextResponse.json({
          languages: await getLanguageDistribution(session.userId),
        });
      case "dashboard": {
        const [overview, topRepos, languages, prStats, repoHealth] =
          await Promise.all([
            getOverview(session.userId, period),
            getTopRepositories(session.userId, period, 5),
            getLanguageDistribution(session.userId),
            getPullRequestStats(session.userId, period),
            getRepositoryHealth(session.userId),
          ]);
        return NextResponse.json({
          overview,
          topRepos,
          languages,
          prStats,
          developerScore: computeDeveloperScore(
            overview,
            prStats,
            languages,
            repoHealth,
          ),
        });
      }
      default:
        return NextResponse.json(
          { error: "UNKNOWN_SECTION" },
          { status: 404 },
        );
    }
  } catch (error) {
    console.error(`[analytics/${section}]`, error);
    return NextResponse.json(
      { error: "ANALYTICS_FAILED" },
      { status: 500 },
    );
  }
}
