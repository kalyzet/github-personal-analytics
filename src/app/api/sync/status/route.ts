import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { decryptToken } from "@/lib/auth/crypto";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { commits, issues, pullRequests, repositories } from "@/lib/db/schema";
import {
  getAccountByUserId,
} from "@/lib/db/repositories/users";
import { getLatestSyncJob, listSyncHistory } from "@/lib/db/repositories/sync";
import {
  GithubRateLimitError,
  getRateLimitStatus,
} from "@/lib/github/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const latestJob = await getLatestSyncJob(session.userId);
  const history = await listSyncHistory(session.userId, 10);

  const [repoCount] = await db
    .select({ value: count() })
    .from(repositories)
    .where(eq(repositories.ownerId, session.userId));
  const [commitCount] = await db
    .select({ value: count() })
    .from(commits)
    .innerJoin(repositories, eq(commits.repositoryId, repositories.id))
    .where(eq(repositories.ownerId, session.userId));
  const [prCount] = await db
    .select({ value: count() })
    .from(pullRequests)
    .innerJoin(repositories, eq(pullRequests.repositoryId, repositories.id))
    .where(eq(repositories.ownerId, session.userId));
  const [issueCount] = await db
    .select({ value: count() })
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(eq(repositories.ownerId, session.userId));

  let rateLimit: {
    remaining: number;
    limit: number;
    resetAt: string | null;
  } | null = null;

  try {
    const account = await getAccountByUserId(session.userId);
    if (account) {
      const status = await getRateLimitStatus(
        decryptToken(account.accessTokenEncrypted),
      );
      rateLimit = {
        remaining: status.remaining,
        limit: status.limit,
        resetAt: status.resetAt?.toISOString() ?? null,
      };
    }
  } catch (error) {
    if (!(error instanceof GithubRateLimitError)) {
      // Rate limit status is best-effort; ignore other failures
    }
    if (error instanceof GithubRateLimitError) {
      rateLimit = {
        remaining: 0,
        limit: 5000,
        resetAt: error.resetAt.toISOString(),
      };
    }
  }

  return NextResponse.json({
    latestJob,
    running:
      latestJob?.status === "RUNNING" || latestJob?.status === "PENDING",
    history,
    stats: {
      repositories: repoCount?.value ?? 0,
      commits: commitCount?.value ?? 0,
      pullRequests: prCount?.value ?? 0,
      issues: issueCount?.value ?? 0,
    },
    rateLimit,
  });
}
