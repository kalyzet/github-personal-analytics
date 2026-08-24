import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../client";
import { syncCursors, syncJobs } from "../schema";

export type SyncJobType = "FULL" | "INCREMENTAL" | "MANUAL";
export type SyncJobStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export type SyncResourceType =
  | "commits"
  | "pull_requests"
  | "issues"
  | "reviews"
  | "releases"
  | "languages";

export async function createSyncJob(userId: number, type: SyncJobType) {
  const [job] = await db
    .insert(syncJobs)
    .values({ userId, type, status: "PENDING", startedAt: new Date() })
    .returning();
  return job;
}

export async function updateSyncJob(
  jobId: number,
  values: Partial<{
    status: SyncJobStatus;
    finishedAt: Date;
    repositoriesScanned: number;
    recordsCreated: number;
    recordsUpdated: number;
    errorMessage: string;
  }>,
) {
  await db.update(syncJobs).set(values).where(eq(syncJobs.id, jobId));
}

export async function getRunningSyncJob(userId: number) {
  const [job] = await db
    .select()
    .from(syncJobs)
    .where(and(eq(syncJobs.userId, userId), eq(syncJobs.status, "RUNNING")))
    .limit(1);
  return job ?? null;
}

export async function getLatestSyncJob(userId: number) {
  const [job] = await db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.userId, userId))
    .orderBy(desc(syncJobs.createdAt))
    .limit(1);
  return job ?? null;
}

export async function listSyncHistory(userId: number, limit = 10) {
  return db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.userId, userId))
    .orderBy(desc(syncJobs.createdAt))
    .limit(limit);
}

export async function getSyncCursor(
  userId: number,
  repositoryId: number,
  resourceType: SyncResourceType,
) {
  const [cursor] = await db
    .select()
    .from(syncCursors)
    .where(
      and(
        eq(syncCursors.userId, userId),
        eq(syncCursors.repositoryId, repositoryId),
        eq(syncCursors.resourceType, resourceType),
      ),
    )
    .limit(1);
  return cursor ?? null;
}

export async function setSyncCursor(
  userId: number,
  repositoryId: number,
  resourceType: SyncResourceType,
  lastSyncedAt: Date,
) {
  await db
    .insert(syncCursors)
    .values({
      userId,
      repositoryId,
      resourceType,
      lastSyncedAt,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        syncCursors.userId,
        syncCursors.repositoryId,
        syncCursors.resourceType,
      ],
      set: {
        lastSyncedAt,
        updatedAt: new Date(),
      },
    });
}

export async function getGlobalSyncCursor(
  userId: number,
  resourceType: SyncResourceType,
) {
  const [cursor] = await db
    .select()
    .from(syncCursors)
    .where(
      and(
        eq(syncCursors.userId, userId),
        isNull(syncCursors.repositoryId),
        eq(syncCursors.resourceType, resourceType),
      ),
    )
    .limit(1);
  return cursor ?? null;
}
