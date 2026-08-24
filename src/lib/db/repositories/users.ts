import { eq } from "drizzle-orm";
import { db } from "../client";
import { githubAccounts, users } from "../schema";

export interface UpsertGithubUserInput {
  githubUserId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  githubCreatedAt: Date | null;
}

export async function upsertUser(input: UpsertGithubUserInput) {
  const [user] = await db
    .insert(users)
    .values({
      githubUserId: input.githubUserId,
      username: input.username,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      bio: input.bio,
      githubCreatedAt: input.githubCreatedAt,
    })
    .onConflictDoUpdate({
      target: users.githubUserId,
      set: {
        username: input.username,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        bio: input.bio,
        githubCreatedAt: input.githubCreatedAt,
        updatedAt: new Date(),
      },
    })
    .returning();

  return user;
}

export interface SaveAccountTokenInput {
  userId: number;
  githubUserId: number;
  username: string;
  accessTokenEncrypted: string;
  scope: string | null;
}

export async function saveAccountToken(input: SaveAccountTokenInput) {
  const [account] = await db
    .insert(githubAccounts)
    .values({
      userId: input.userId,
      githubUserId: input.githubUserId,
      username: input.username,
      accessTokenEncrypted: input.accessTokenEncrypted,
      scope: input.scope,
      lastUsedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: githubAccounts.githubUserId,
      set: {
        userId: input.userId,
        username: input.username,
        accessTokenEncrypted: input.accessTokenEncrypted,
        scope: input.scope,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();

  return account;
}

export async function getAccountByUserId(userId: number) {
  const [account] = await db
    .select()
    .from(githubAccounts)
    .where(eq(githubAccounts.userId, userId))
    .limit(1);
  return account ?? null;
}

export async function deleteAccountByUserId(userId: number) {
  await db.delete(githubAccounts).where(eq(githubAccounts.userId, userId));
}
