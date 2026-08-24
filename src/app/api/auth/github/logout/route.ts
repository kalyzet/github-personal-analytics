import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function GET() {
  await destroySession();
  return NextResponse.redirect("/");
}

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
