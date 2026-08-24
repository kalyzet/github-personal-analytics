import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getRepoMapByGithubId } from "@/lib/db/repositories/repositories";
import { requestSync } from "@/services/sync/engine";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: { type?: string } = {};
  try {
    body = (await request.json()) as { type?: string };
  } catch {
    // no body provided, use default behavior
  }

  let type: "FULL" | "INCREMENTAL";
  if (body.type === "FULL") {
    type = "FULL";
  } else if (body.type === "INCREMENTAL") {
    type = "INCREMENTAL";
  } else {
    const existingRepos = await getRepoMapByGithubId(session.userId);
    type = existingRepos.size > 0 ? "INCREMENTAL" : "FULL";
  }

  const outcome = await requestSync(session.userId, type);

  if (!outcome.started) {
    return NextResponse.json(
      { jobId: outcome.jobId, reason: outcome.reason },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { jobId: outcome.jobId, type },
    { status: 202 },
  );
}
