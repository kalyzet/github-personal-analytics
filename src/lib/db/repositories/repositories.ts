import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../client";
import {
  commits,
  issueLabels,
  issues,
  pullRequestReviews,
  pullRequests,
  releases,
  repositories,
  repositoryLanguages,
} from "../schema";
import type {
  GithubCommitListItem,
  GithubIssue,
  GithubPullRequest,
  GithubRelease,
  GithubRepository,
  GithubReview,
} from "@/types/github";

const CHUNK_SIZE = 40;

function chunk<T>(items: T[], size = CHUNK_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export interface UpsertRepositoryInput {
  githubId: number;
  ownerId: number;
  repo: GithubRepository;
}

export async function upsertRepositories(
  ownerId: number,
  repos: GithubRepository[],
): Promise<number> {
  for (const batch of chunk(repos)) {
    await db
      .insert(repositories)
      .values(
        batch.map((repo) => ({
          githubId: repo.id,
          ownerId,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          htmlUrl: repo.html_url,
          primaryLanguage: repo.language,
          stars: repo.stargazers_count ?? 0,
          forks: repo.forks_count ?? 0,
          watchers: repo.watchers_count ?? 0,
          size: repo.size ?? 0,
          openIssues: repo.open_issues_count ?? 0,
          isPrivate: repo.private ?? false,
          isFork: repo.fork ?? false,
          isArchived: repo.archived ?? false,
          githubCreatedAt: repo.created_at ? new Date(repo.created_at) : null,
          githubUpdatedAt: repo.updated_at ? new Date(repo.updated_at) : null,
          githubPushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
        })),
      )
      .onConflictDoUpdate({
        target: [repositories.ownerId, repositories.githubId],
        set: {
          name: sqlExcluded("name"),
          fullName: sqlExcluded("full_name"),
          description: sqlExcluded("description"),
          htmlUrl: sqlExcluded("html_url"),
          primaryLanguage: sqlExcluded("primary_language"),
          stars: sqlExcluded("stars"),
          forks: sqlExcluded("forks"),
          watchers: sqlExcluded("watchers"),
          size: sqlExcluded("size"),
          openIssues: sqlExcluded("open_issues"),
          isPrivate: sqlExcluded("is_private"),
          isFork: sqlExcluded("is_fork"),
          isArchived: sqlExcluded("is_archived"),
          githubCreatedAt: sqlExcluded("github_created_at"),
          githubUpdatedAt: sqlExcluded("github_updated_at"),
          githubPushedAt: sqlExcluded("github_pushed_at"),
          updatedAt: new Date(),
        },
      });
  }
  return repos.length;
}

function sqlExcluded(column: string) {
  return sql.raw(`excluded.${column}`);
}

export async function getRepoMapByGithubId(
  ownerId: number,
): Promise<Map<number, { id: number; name: string; fullName: string; isFork: boolean; isArchived: boolean }>> {
  const rows = await db
    .select({
      id: repositories.id,
      githubId: repositories.githubId,
      name: repositories.name,
      fullName: repositories.fullName,
      isFork: repositories.isFork,
      isArchived: repositories.isArchived,
    })
    .from(repositories)
    .where(eq(repositories.ownerId, ownerId));

  return new Map(rows.map((row) => [row.githubId, row]));
}

export async function upsertRepositoryLanguages(
  repositoryId: number,
  languages: Array<{ language: string; bytes: number; percentage: number }>,
): Promise<number> {
  if (languages.length === 0) return 0;

  await db
    .insert(repositoryLanguages)
    .values(
      languages.map((lang) => ({
        repositoryId,
        language: lang.language,
        bytes: lang.bytes,
        percentage: lang.percentage,
      })),
    )
    .onConflictDoUpdate({
      target: [repositoryLanguages.repositoryId, repositoryLanguages.language],
      set: {
        bytes: sqlExcluded("bytes"),
        percentage: sqlExcluded("percentage"),
        calculatedAt: new Date(),
      },
    });

  return languages.length;
}

export interface CommitRow {
  sha: string;
  authorLogin: string | null;
  authorName: string | null;
  committerLogin: string | null;
  committerName: string | null;
  message: string | null;
  committedAt: Date;
  authoredAt: Date | null;
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
  githubUrl: string | null;
}

export async function upsertCommits(
  repositoryId: number,
  commitRows: CommitRow[],
): Promise<number> {
  for (const batch of chunk(commitRows)) {
    await db
      .insert(commits)
      .values(batch.map((c) => ({ repositoryId, ...c })))
      .onConflictDoUpdate({
        target: [commits.repositoryId, commits.sha],
        set: {
          authorLogin: sqlExcluded("author_login"),
          authorName: sqlExcluded("author_name"),
          committerLogin: sqlExcluded("committer_login"),
          committerName: sqlExcluded("committer_name"),
          message: sqlExcluded("message"),
          committedAt: sqlExcluded("committed_at"),
          authoredAt: sqlExcluded("authored_at"),
          additions: sqlExcluded("additions"),
          deletions: sqlExcluded("deletions"),
          changedFiles: sqlExcluded("changed_files"),
          githubUrl: sqlExcluded("github_url"),
        },
      });
  }
  return commitRows.length;
}

function toCommitRows(items: GithubCommitListItem[]): CommitRow[] {
  return items.map((item) => ({
    sha: item.sha,
    authorLogin: item.author?.login ?? null,
    authorName: item.commit.author?.name ?? null,
    committerLogin: item.committer?.login ?? null,
    committerName: item.commit.committer?.name ?? null,
    message: item.commit.message,
    committedAt: new Date(item.commit.committer?.date ?? item.commit.author?.date ?? new Date().toISOString()),
    authoredAt: item.commit.author?.date ? new Date(item.commit.author.date) : null,
    additions: null,
    deletions: null,
    changedFiles: null,
    githubUrl: item.html_url,
  }));
}

export async function syncCommitsFromApi(
  repositoryId: number,
  items: GithubCommitListItem[],
): Promise<number> {
  return upsertCommits(repositoryId, toCommitRows(items));
}

export async function updateCommitStats(
  repositoryId: number,
  sha: string,
  stats: { additions: number; deletions: number; changedFiles: number },
): Promise<void> {
  await db
    .update(commits)
    .set({
      additions: stats.additions,
      deletions: stats.deletions,
      changedFiles: stats.changedFiles,
    })
    .where(and(eq(commits.repositoryId, repositoryId), eq(commits.sha, sha)));
}

export async function findCommitsMissingStats(
  repositoryId: number,
  limit: number,
): Promise<Array<{ sha: string }>> {
  return db
    .select({ sha: commits.sha })
    .from(commits)
    .where(
      and(eq(commits.repositoryId, repositoryId), isNull(commits.additions)),
    )
    .orderBy(desc(commits.committedAt))
    .limit(limit);
}

export async function upsertPullRequest(
  repositoryId: number,
  pr: GithubPullRequest,
): Promise<number> {
  const [row] = await db
    .insert(pullRequests)
    .values({
      repositoryId,
      githubId: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      authorLogin: pr.user?.login ?? null,
      createdAt: new Date(pr.created_at),
      updatedAt: pr.updated_at ? new Date(pr.updated_at) : null,
      closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      additions: pr.additions ?? null,
      deletions: pr.deletions ?? null,
      changedFiles: pr.changed_files ?? null,
      comments: pr.comments ?? 0,
      isMerged: Boolean(pr.merged_at),
      githubUrl: pr.html_url,
    })
    .onConflictDoUpdate({
      target: [pullRequests.repositoryId, pullRequests.number],
      set: {
        title: sqlExcluded("title"),
        state: sqlExcluded("state"),
        authorLogin: sqlExcluded("author_login"),
        updatedAt: sqlExcluded("updated_at"),
        closedAt: sqlExcluded("closed_at"),
        mergedAt: sqlExcluded("merged_at"),
        additions: sqlExcluded("additions"),
        deletions: sqlExcluded("deletions"),
        changedFiles: sqlExcluded("changed_files"),
        comments: sqlExcluded("comments"),
        isMerged: sqlExcluded("is_merged"),
        githubUrl: sqlExcluded("github_url"),
      },
    })
    .returning({ id: pullRequests.id });

  return row.id;
}

export async function replacePullRequestReviews(
  pullRequestId: number,
  reviews: GithubReview[],
): Promise<number> {
  await db
    .delete(pullRequestReviews)
    .where(eq(pullRequestReviews.pullRequestId, pullRequestId));

  if (reviews.length === 0) return 0;

  for (const batch of chunk(reviews)) {
    await db.insert(pullRequestReviews).values(
      batch.map((review) => ({
        pullRequestId,
        githubId: review.id,
        reviewerLogin: review.user?.login ?? null,
        state: review.state,
        body: review.body,
        submittedAt: review.submitted_at ? new Date(review.submitted_at) : null,
      })),
    );
  }

  return reviews.length;
}

export async function upsertIssues(
  repositoryId: number,
  items: GithubIssue[],
): Promise<{ processed: number; labelCount: number }> {
  let labelCount = 0;

  for (const issue of items) {
    const [row] = await db
      .insert(issues)
      .values({
        repositoryId,
        githubId: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        authorLogin: issue.user?.login ?? null,
        createdAt: new Date(issue.created_at),
        updatedAt: issue.updated_at ? new Date(issue.updated_at) : null,
        closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
        comments: issue.comments ?? 0,
        isPullRequest: Boolean(issue.pull_request),
        githubUrl: issue.html_url,
      })
      .onConflictDoUpdate({
        target: [issues.repositoryId, issues.number],
        set: {
          title: sqlExcluded("title"),
          state: sqlExcluded("state"),
          authorLogin: sqlExcluded("author_login"),
          updatedAt: sqlExcluded("updated_at"),
          closedAt: sqlExcluded("closed_at"),
          comments: sqlExcluded("comments"),
          isPullRequest: sqlExcluded("is_pull_request"),
          githubUrl: sqlExcluded("github_url"),
        },
      })
      .returning({ id: issues.id });

    await db.delete(issueLabels).where(eq(issueLabels.issueId, row.id));
    if (issue.labels?.length > 0) {
      await db.insert(issueLabels).values(
        issue.labels.map((label) => ({
          issueId: row.id,
          name: label.name,
          color: label.color,
        })),
      );
      labelCount += issue.labels.length;
    }
  }

  return { processed: items.length, labelCount };
}

export async function upsertReleases(
  repositoryId: number,
  items: GithubRelease[],
): Promise<number> {
  if (items.length === 0) return 0;

  for (const batch of chunk(items)) {
    await db
      .insert(releases)
      .values(
        batch.map((release) => ({
          repositoryId,
          githubId: release.id,
          tagName: release.tag_name,
          name: release.name,
          authorLogin: release.author?.login ?? null,
          createdAt: release.created_at ? new Date(release.created_at) : null,
          publishedAt: release.published_at
            ? new Date(release.published_at)
            : null,
          isPrerelease: release.prerelease ?? false,
          isDraft: release.draft ?? false,
        })),
      )
      .onConflictDoUpdate({
        target: [releases.repositoryId, releases.githubId],
        set: {
          tagName: sqlExcluded("tag_name"),
          name: sqlExcluded("name"),
          authorLogin: sqlExcluded("author_login"),
          createdAt: sqlExcluded("created_at"),
          publishedAt: sqlExcluded("published_at"),
          isPrerelease: sqlExcluded("is_prerelease"),
          isDraft: sqlExcluded("is_draft"),
        },
      });
  }

  return items.length;
}
