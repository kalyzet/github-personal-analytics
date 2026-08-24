import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  analyticsSnapshots,
  dailyActivity,
  insights,
  repositories,
  syncCursors,
  syncJobs,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import {
  deleteAccountByUserId,
} from "@/lib/db/repositories/users";

async function requireSession() {
  const session = await getSession();
  return session;
}

export async function POST() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await deleteAccountByUserId(session.userId);

  return NextResponse.json({ ok: true, disconnected: true });
}

export async function DELETE(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const scope = new URL(request.url).searchParams.get("scope");

  if (scope === "analytics") {
    await db.delete(repositories).where(eq(repositories.ownerId, session.userId));
    await db.delete(dailyActivity).where(eq(dailyActivity.userId, session.userId));
    await db.delete(syncCursors).where(eq(syncCursors.userId, session.userId));
    await db.delete(syncJobs).where(eq(syncJobs.userId, session.userId));
    await db.delete(insights).where(eq(insights.userId, session.userId));
    await db
      .delete(analyticsSnapshots)
      .where(eq(analyticsSnapshots.userId, session.userId));
    return NextResponse.json({ ok: true, deleted: "analytics" });
  }

  if (scope === "all") {
    await deleteAccountByUserId(session.userId);
    await db.delete(repositories).where(eq(repositories.ownerId, session.userId));
    await db.delete(dailyActivity).where(eq(dailyActivity.userId, session.userId));
    await db.delete(syncCursors).where(eq(syncCursors.userId, session.userId));
    await db.delete(syncJobs).where(eq(syncJobs.userId, session.userId));
    await db.delete(insights).where(eq(insights.userId, session.userId));
    await db
      .delete(analyticsSnapshots)
      .where(eq(analyticsSnapshots.userId, session.userId));
    return NextResponse.json({ ok: true, deleted: "all" });
  }

  return NextResponse.json({ error: "INVALID_SCOPE" }, { status: 400 });
}
