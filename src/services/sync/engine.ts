import { decryptToken } from "@/lib/auth/crypto";
import {
  findCommitsMissingStats,
  getRepoMapByGithubId,
  replacePullRequestReviews,
  syncCommitsFromApi,
  updateCommitStats,
  upsertIssues,
  upsertPullRequest,
  upsertReleases,
  upsertRepositories,
  upsertRepositoryLanguages,
} from "@/lib/db/repositories/repositories";
import {
  getAccountByUserId,
  upsertUser,
} from "@/lib/db/repositories/users";
import { rebuildAggregations } from "@/lib/db/repositories/aggregation";
import {
  createSyncJob,
  getRunningSyncJob,
  setSyncCursor,
  updateSyncJob,
  getSyncCursor,
  type SyncJobType,
} from "@/lib/db/repositories/sync";
import { GithubApiError, GithubRateLimitError, getRateLimitStatus } from "@/lib/github/client";
import { listCommits, getCommitDetail } from "@/lib/github/commits";
import { listIssues } from "@/lib/github/issues";
import { getRepositoryLanguages } from "@/lib/github/languages";
import { listPullRequests } from "@/lib/github/pull-requests";
import { listPullRequestReviews } from "@/lib/github/reviews";
import { listReleases } from "@/lib/github/releases";
import { getCurrentUser } from "@/lib/github/users";
import { listAuthenticatedUserRepositories } from "@/lib/github/repositories";

const MAX_COMMIT_DETAIL_PER_JOB = 200;
const MIN_RATE_LIMIT_REMAINING = 50;

const activeUsers = new Set<number>();

export interface SyncOutcome {
  jobId: number;
  started: boolean;
  reason?: string;
}

export async function requestSync(
  userId: number,
  preferredType: SyncJobType = "FULL",
): Promise<SyncOutcome> {
  const runningInDb = await getRunningSyncJob(userId);
  if (runningInDb) {
    if (activeUsers.has(userId)) {
      return { jobId: runningInDb.id, started: false, reason: "SYNC_IN_PROGRESS" };
    }
    // Stale job from a dead process (server restart / crash)
    await updateSyncJob(runningInDb.id, {
      status: "FAILED",
      finishedAt: new Date(),
      errorMessage: "Sync interrupted (process restarted)",
    });
  }

  const job = await createSyncJob(userId, preferredType);
  activeUsers.add(userId);

  void runSyncJob({
    jobId: job.id,
    userId,
    useCursors: preferredType === "INCREMENTAL",
  })
    .catch((error) => {
      console.error("[sync] unexpected failure", error);
    })
    .finally(() => {
      activeUsers.delete(userId);
    });

  return { jobId: job.id, started: true };
}

async function runSyncJob(params: {
  jobId: number;
  userId: number;
  useCursors: boolean;
}): Promise<void> {
  const { jobId, userId, useCursors } = params;

  let repositoriesScanned = 0;
  let recordsProcessed = 0;

  try {
    await updateSyncJob(jobId, { status: "RUNNING" });

    const account = await getAccountByUserId(userId);
    if (!account) throw new Error("GitHub account is not connected");
    const token = decryptToken(account.accessTokenEncrypted);

    const rateLimit = await getRateLimitStatus(token);
    if (rateLimit.remaining < MIN_RATE_LIMIT_REMAINING) {
      throw new Error(
        `GitHub API rate limit almost exhausted (${rateLimit.remaining} left)` +
          (rateLimit.resetAt ? `, resets at ${rateLimit.resetAt.toISOString()}` : ""),
      );
    }

    const ghUser = await getCurrentUser(token);
    await upsertUser({
      githubUserId: ghUser.id,
      username: ghUser.login,
      displayName: ghUser.name,
      avatarUrl: ghUser.avatar_url,
      bio: ghUser.bio,
      githubCreatedAt: ghUser.created_at ? new Date(ghUser.created_at) : null,
    });

    const ghRepos = await listAuthenticatedUserRepositories(token);
    recordsProcessed += await upsertRepositories(userId, ghRepos);
    repositoriesScanned = ghRepos.length;

    const repoMap = await getRepoMapByGithubId(userId);

    let commitDetailBudget = MAX_COMMIT_DETAIL_PER_JOB;

    for (const ghRepo of ghRepos) {
      const localRepo = repoMap.get(ghRepo.id);
      if (!localRepo) continue;

      const [owner, repoName] = ghRepo.full_name.split("/");
      if (!owner || !repoName) continue;

      const syncStart = new Date();

      const languages = await getRepositoryLanguages(token, owner, repoName);
      recordsProcessed += await upsertRepositoryLanguages(
        localRepo.id,
        languages,
      );
      await setSyncCursor(userId, localRepo.id, "languages", syncStart);

      // --- Commits ---
      const commitCursor = useCursors
        ? await getSyncCursor(userId, localRepo.id, "commits")
        : null;
      const commitSince =
        commitCursor?.lastSyncedAt?.toISOString() ?? undefined;

      const commitItems = await listCommits(token, owner, repoName, {
        since: commitSince,
      });
      recordsProcessed += await syncCommitsFromApi(localRepo.id, commitItems);

      if (commitDetailBudget > 0) {
        const missingStats = await findCommitsMissingStats(
          localRepo.id,
          commitDetailBudget,
        );
        const DETAIL_CONCURRENCY = 8;
        for (
          let i = 0;
          i < missingStats.length && commitDetailBudget > 0;
          i += DETAIL_CONCURRENCY
        ) {
          const batch = missingStats.slice(i, i + DETAIL_CONCURRENCY);
          const results = await Promise.allSettled(
            batch.map(async ({ sha }) => ({
              sha,
              detail: await getCommitDetail(token, owner, repoName, sha),
            })),
          );
          for (const result of results) {
            if (result.status === "fulfilled") {
              const { sha, detail } = result.value;
              if (detail.stats) {
                await updateCommitStats(localRepo.id, sha, {
                  additions: detail.stats.additions,
                  deletions: detail.stats.deletions,
                  changedFiles: detail.files?.length ?? 0,
                });
              }
              commitDetailBudget -= 1;
            } else if (
              result.reason instanceof GithubApiError &&
              result.reason.status === 404
            ) {
              commitDetailBudget -= 1;
            } else if (result.reason instanceof GithubRateLimitError) {
              throw result.reason;
            }
          }
        }
      }
      await setSyncCursor(userId, localRepo.id, "commits", syncStart);

      // --- Pull Requests + Reviews ---
      const prCursor = useCursors
        ? await getSyncCursor(userId, localRepo.id, "pull_requests")
        : null;
      const prSince = prCursor?.lastSyncedAt ?? null;
      const prs = await listPullRequests(token, owner, repoName, {
        since: prSince?.toISOString(),
      });

      for (const pr of prs) {
        const prId = await upsertPullRequest(localRepo.id, pr);
        recordsProcessed += 1;

        const needsReviewRefresh =
          !prSince || (pr.updated_at && new Date(pr.updated_at) > prSince);
        if (needsReviewRefresh) {
          const reviews = await listPullRequestReviews(
            token,
            owner,
            repoName,
            pr.number,
          );
          recordsProcessed += await replacePullRequestReviews(prId, reviews);
        }
      }
      await setSyncCursor(userId, localRepo.id, "pull_requests", syncStart);
      await setSyncCursor(userId, localRepo.id, "reviews", syncStart);

      // --- Issues ---
      const issueCursor = useCursors
        ? await getSyncCursor(userId, localRepo.id, "issues")
        : null;
      const issues = await listIssues(token, owner, repoName, {
        since: issueCursor?.lastSyncedAt?.toISOString(),
      });
      const issueResult = await upsertIssues(localRepo.id, issues);
      recordsProcessed += issueResult.processed + issueResult.labelCount;
      await setSyncCursor(userId, localRepo.id, "issues", syncStart);

      // --- Releases ---
      const releases = await listReleases(token, owner, repoName);
      recordsProcessed += await upsertReleases(localRepo.id, releases);
      await setSyncCursor(userId, localRepo.id, "releases", syncStart);

      // Live progress update so the UI can show movement mid-sync
      await updateSyncJob(jobId, { recordsCreated: recordsProcessed });
    }

    const aggregation = await rebuildAggregations(
      userId,
      account.username.toLowerCase(),
    );
    recordsProcessed += aggregation.days + aggregation.repoDays;

    await updateSyncJob(jobId, {
      status: "SUCCESS",
      finishedAt: new Date(),
      repositoriesScanned,
      recordsCreated: recordsProcessed,
    });
  } catch (error) {
    let message =
      error instanceof Error ? error.message : "Unknown sync failure";

    if (error instanceof GithubRateLimitError) {
      message = `GitHub API rate limit reached. Resets at ${error.resetAt.toISOString()}`;
    }

    console.error("[sync] failed", error);

    await updateSyncJob(jobId, {
      status: "FAILED",
      finishedAt: new Date(),
      errorMessage: message.slice(0, 500),
    });
  }
}
