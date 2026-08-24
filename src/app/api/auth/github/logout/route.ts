import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/lib/auth/session";

function homeUrl(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return appUrl;
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  await destroySession();
  return NextResponse.redirect(homeUrl(request));
}

export async function POST(request: NextRequest) {
  await destroySession();
  return NextResponse.json({ ok: true });
}
