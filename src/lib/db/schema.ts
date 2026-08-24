import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

const boolean = (name: string) => integer(name, { mode: "boolean" });

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    githubUserId: integer("github_user_id").notNull(),
    username: text("username").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    githubCreatedAt: integer("github_created_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("users_github_user_id_unique").on(table.githubUserId)],
);

export const githubAccounts = sqliteTable(
  "github_accounts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    githubUserId: integer("github_user_id").notNull(),
    username: text("username").notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
    scope: text("scope"),
    connectedAt: integer("connected_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("github_accounts_user_id_idx").on(table.userId),
    uniqueIndex("github_accounts_github_user_id_unique").on(table.githubUserId),
  ],
);

// ---------------------------------------------------------------------------
// GitHub Data
// ---------------------------------------------------------------------------

export const repositories = sqliteTable(
  "repositories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    githubId: integer("github_id").notNull(),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    description: text("description"),
    htmlUrl: text("html_url"),
    primaryLanguage: text("primary_language"),
    stars: integer("stars").notNull().default(0),
    forks: integer("forks").notNull().default(0),
    watchers: integer("watchers").notNull().default(0),
    size: integer("size").notNull().default(0),
    openIssues: integer("open_issues").notNull().default(0),
    isPrivate: boolean("is_private").notNull().default(false),
    isFork: boolean("is_fork").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    githubCreatedAt: integer("github_created_at", { mode: "timestamp" }),
    githubUpdatedAt: integer("github_updated_at", { mode: "timestamp" }),
    githubPushedAt: integer("github_pushed_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("repositories_owner_github_id_unique").on(
      table.ownerId,
      table.githubId,
    ),
    index("repositories_owner_id_idx").on(table.ownerId),
    index("repositories_full_name_idx").on(table.fullName),
  ],
);

export const repositoryLanguages = sqliteTable(
  "repository_languages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    repositoryId: integer("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    bytes: integer("bytes").notNull().default(0),
    percentage: real("percentage").notNull().default(0),
    calculatedAt: integer("calculated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("repository_languages_repo_language_unique").on(
      table.repositoryId,
      table.language,
    ),
    index("repository_languages_repository_id_idx").on(table.repositoryId),
  ],
);

export const commits = sqliteTable(
  "commits",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    repositoryId: integer("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    sha: text("sha").notNull(),
    authorLogin: text("author_login"),
    authorName: text("author_name"),
    committerLogin: text("committer_login"),
    committerName: text("committer_name"),
    message: text("message"),
    committedAt: integer("committed_at", { mode: "timestamp" }).notNull(),
    authoredAt: integer("authored_at", { mode: "timestamp" }),
    additions: integer("additions"),
    deletions: integer("deletions"),
    changedFiles: integer("changed_files"),
    githubUrl: text("github_url"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("commits_repository_sha_unique").on(
      table.repositoryId,
      table.sha,
    ),
    index("commits_repository_committed_at_idx").on(
      table.repositoryId,
      table.committedAt,
    ),
    index("commits_author_committed_at_idx").on(
      table.authorLogin,
      table.committedAt,
    ),
  ],
);

export const pullRequests = sqliteTable(
  "pull_requests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    repositoryId: integer("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    githubId: integer("github_id").notNull(),
    number: integer("number").notNull(),
    title: text("title"),
    state: text("state").notNull(),
    authorLogin: text("author_login"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
    closedAt: integer("closed_at", { mode: "timestamp" }),
    mergedAt: integer("merged_at", { mode: "timestamp" }),
    additions: integer("additions"),
    deletions: integer("deletions"),
    changedFiles: integer("changed_files"),
    comments: integer("comments").notNull().default(0),
    isMerged: boolean("is_merged").notNull().default(false),
    githubUrl: text("github_url"),
  },
  (table) => [
    uniqueIndex("pull_requests_repository_number_unique").on(
      table.repositoryId,
      table.number,
    ),
    index("pull_requests_repository_created_at_idx").on(
      table.repositoryId,
      table.createdAt,
    ),
    index("pull_requests_author_login_idx").on(table.authorLogin),
  ],
);

export const pullRequestReviews = sqliteTable(
  "pull_request_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pullRequestId: integer("pull_request_id")
      .notNull()
      .references(() => pullRequests.id, { onDelete: "cascade" }),
    githubId: integer("github_id"),
    reviewerLogin: text("reviewer_login"),
    state: text("state").notNull(),
    body: text("body"),
    submittedAt: integer("submitted_at", { mode: "timestamp" }),
  },
  (table) => [
    uniqueIndex("pull_request_reviews_github_id_unique").on(table.githubId),
    index("pull_request_reviews_pull_request_id_idx").on(table.pullRequestId),
    index("pull_request_reviews_reviewer_idx").on(table.reviewerLogin),
  ],
);

export const issues = sqliteTable(
  "issues",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    repositoryId: integer("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    githubId: integer("github_id").notNull(),
    number: integer("number").notNull(),
    title: text("title"),
    state: text("state").notNull(),
    authorLogin: text("author_login"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
    closedAt: integer("closed_at", { mode: "timestamp" }),
    comments: integer("comments").notNull().default(0),
    isPullRequest: boolean("is_pull_request").notNull().default(false),
    githubUrl: text("github_url"),
  },
  (table) => [
    uniqueIndex("issues_repository_number_unique").on(
      table.repositoryId,
      table.number,
    ),
    index("issues_repository_created_at_idx").on(
      table.repositoryId,
      table.createdAt,
    ),
  ],
);

export const issueLabels = sqliteTable(
  "issue_labels",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    issueId: integer("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
  },
  (table) => [
    uniqueIndex("issue_labels_issue_name_unique").on(table.issueId, table.name),
    index("issue_labels_issue_id_idx").on(table.issueId),
  ],
);

export const releases = sqliteTable(
  "releases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    repositoryId: integer("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    githubId: integer("github_id").notNull(),
    tagName: text("tag_name").notNull(),
    name: text("name"),
    authorLogin: text("author_login"),
    createdAt: integer("created_at", { mode: "timestamp" }),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    isPrerelease: boolean("is_prerelease").notNull().default(false),
    isDraft: boolean("is_draft").notNull().default(false),
  },
  (table) => [
    uniqueIndex("releases_repository_github_id_unique").on(
      table.repositoryId,
      table.githubId,
    ),
    index("releases_repository_published_at_idx").on(
      table.repositoryId,
      table.publishedAt,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export const dailyActivity = sqliteTable(
  "daily_activity",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    commits: integer("commits").notNull().default(0),
    pullRequests: integer("pull_requests").notNull().default(0),
    issues: integer("issues").notNull().default(0),
    reviews: integer("reviews").notNull().default(0),
    releases: integer("releases").notNull().default(0),
    additions: integer("additions").notNull().default(0),
    deletions: integer("deletions").notNull().default(0),
    activeRepositories: integer("active_repositories").notNull().default(0),
    totalActivity: integer("total_activity").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("daily_activity_user_date_unique").on(table.userId, table.date),
    index("daily_activity_user_date_idx").on(table.userId, table.date),
  ],
);

export const repositoryActivity = sqliteTable(
  "repository_activity",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    repositoryId: integer("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    commits: integer("commits").notNull().default(0),
    pullRequests: integer("pull_requests").notNull().default(0),
    issues: integer("issues").notNull().default(0),
    reviews: integer("reviews").notNull().default(0),
    releases: integer("releases").notNull().default(0),
    additions: integer("additions").notNull().default(0),
    deletions: integer("deletions").notNull().default(0),
    totalActivity: integer("total_activity").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("repository_activity_repo_date_unique").on(
      table.repositoryId,
      table.date,
    ),
    index("repository_activity_repo_date_idx").on(
      table.repositoryId,
      table.date,
    ),
  ],
);

export const analyticsSnapshots = sqliteTable(
  "analytics_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodType: text("period_type").notNull(), // MONTH | WEEK | YEAR | CUSTOM
    periodStart: text("period_start").notNull(), // YYYY-MM-DD
    periodEnd: text("period_end").notNull(), // YYYY-MM-DD
    activityScore: real("activity_score"),
    consistencyScore: real("consistency_score"),
    collaborationScore: real("collaboration_score"),
    projectScore: real("project_score"),
    technologyScore: real("technology_score"),
    maintenanceScore: real("maintenance_score"),
    developerScore: real("developer_score"),
    createdAt: createdAt(),
  },
  (table) => [
    index("analytics_snapshots_user_period_idx").on(
      table.userId,
      table.periodType,
      table.periodStart,
    ),
  ],
);

export const insights = sqliteTable(
  "insights",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    severity: text("severity"), // info | positive | warning | negative
    periodStart: text("period_start"),
    periodEnd: text("period_end"),
    metadata: text("metadata", { mode: "json" }),
    createdAt: createdAt(),
  },
  (table) => [
    index("insights_user_type_idx").on(table.userId, table.type),
    index("insights_user_created_at_idx").on(table.userId, table.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

export const syncJobs = sqliteTable(
  "sync_jobs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // FULL | INCREMENTAL | MANUAL
    status: text("status").notNull().default("PENDING"), // PENDING | RUNNING | SUCCESS | FAILED
    startedAt: integer("started_at", { mode: "timestamp" }),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
    repositoriesScanned: integer("repositories_scanned").notNull().default(0),
    recordsCreated: integer("records_created").notNull().default(0),
    recordsUpdated: integer("records_updated").notNull().default(0),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
  },
  (table) => [
    index("sync_jobs_user_status_idx").on(table.userId, table.status),
    index("sync_jobs_user_created_at_idx").on(table.userId, table.createdAt),
  ],
);

export const syncCursors = sqliteTable(
  "sync_cursors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    repositoryId: integer("repository_id").references(() => repositories.id, {
      onDelete: "cascade",
    }),
    resourceType: text("resource_type").notNull(), // commits | pull_requests | issues | reviews | releases | languages
    lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
    lastCursor: text("last_cursor"),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("sync_cursors_user_repo_resource_unique").on(
      table.userId,
      table.repositoryId,
      table.resourceType,
    ),
    index("sync_cursors_user_resource_idx").on(
      table.userId,
      table.resourceType,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many, one }) => ({
  githubAccount: one(githubAccounts, {
    fields: [users.id],
    references: [githubAccounts.userId],
  }),
  repositories: many(repositories),
  dailyActivities: many(dailyActivity),
}));

export const githubAccountsRelations = relations(
  githubAccounts,
  ({ one }) => ({
    user: one(users, {
      fields: [githubAccounts.userId],
      references: [users.id],
    }),
  }),
);

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  owner: one(users, {
    fields: [repositories.ownerId],
    references: [users.id],
  }),
  languages: many(repositoryLanguages),
  commits: many(commits),
  pullRequests: many(pullRequests),
  issues: many(issues),
  releases: many(releases),
  activities: many(repositoryActivity),
}));

export const repositoryLanguagesRelations = relations(
  repositoryLanguages,
  ({ one }) => ({
    repository: one(repositories, {
      fields: [repositoryLanguages.repositoryId],
      references: [repositories.id],
    }),
  }),
);

export const commitsRelations = relations(commits, ({ one }) => ({
  repository: one(repositories, {
    fields: [commits.repositoryId],
    references: [repositories.id],
  }),
}));

export const pullRequestsRelations = relations(pullRequests, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [pullRequests.repositoryId],
    references: [repositories.id],
  }),
  reviews: many(pullRequestReviews),
}));

export const pullRequestReviewsRelations = relations(
  pullRequestReviews,
  ({ one }) => ({
    pullRequest: one(pullRequests, {
      fields: [pullRequestReviews.pullRequestId],
      references: [pullRequests.id],
    }),
  }),
);

export const issuesRelations = relations(issues, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [issues.repositoryId],
    references: [repositories.id],
  }),
  labels: many(issueLabels),
}));

export const issueLabelsRelations = relations(issueLabels, ({ one }) => ({
  issue: one(issues, {
    fields: [issueLabels.issueId],
    references: [issues.id],
  }),
}));

export const releasesRelations = relations(releases, ({ one }) => ({
  repository: one(repositories, {
    fields: [releases.repositoryId],
    references: [repositories.id],
  }),
}));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type GithubAccount = typeof githubAccounts.$inferSelect;
export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
export type RepositoryLanguage = typeof repositoryLanguages.$inferSelect;
export type Commit = typeof commits.$inferSelect;
export type NewCommit = typeof commits.$inferInsert;
export type PullRequest = typeof pullRequests.$inferSelect;
export type NewPullRequest = typeof pullRequests.$inferInsert;
export type PullRequestReview = typeof pullRequestReviews.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type IssueLabel = typeof issueLabels.$inferSelect;
export type Release = typeof releases.$inferSelect;
export type DailyActivity = typeof dailyActivity.$inferSelect;
export type RepositoryActivity = typeof repositoryActivity.$inferSelect;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type Insight = typeof insights.$inferSelect;
export type SyncJob = typeof syncJobs.$inferSelect;
export type SyncCursor = typeof syncCursors.$inferSelect;
