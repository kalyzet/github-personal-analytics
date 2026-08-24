import { NextResponse, type NextRequest } from "next/server";
import { encryptToken } from "@/lib/auth/crypto";
import { createSession } from "@/lib/auth/session";
import { saveAccountToken, upsertUser } from "@/lib/db/repositories/users";
import { getCurrentUser } from "@/lib/github/users";
import type { GithubUser } from "@/types/github";

const OAUTH_STATE_COOKIE = "gpa_oauth_state";

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

async function exchangeCodeForToken(
  code: string,
): Promise<AccessTokenResponse> {
  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/github/callback`,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Token exchange failed with status ${response.status}`);
  }

  const data = (await response.json()) as AccessTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (data.error || !data.access_token) {
    throw new Error(data.error_description ?? data.error ?? "Token exchange failed");
  }

  return data;
}

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(`${appUrl}/?auth_error=${encodeURIComponent(oauthError)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}/?auth_error=missing_code`);
    }

    const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(`${appUrl}/?auth_error=invalid_state`);
    }

    const tokenData = await exchangeCodeForToken(code);
    const githubUser: GithubUser = await getCurrentUser(tokenData.access_token);

    const user = await upsertUser({
      githubUserId: githubUser.id,
      username: githubUser.login,
      displayName: githubUser.name,
      avatarUrl: githubUser.avatar_url,
      bio: githubUser.bio,
      githubCreatedAt: githubUser.created_at
        ? new Date(githubUser.created_at)
        : null,
    });

    await saveAccountToken({
      userId: user.id,
      githubUserId: githubUser.id,
      username: githubUser.login,
      accessTokenEncrypted: encryptToken(tokenData.access_token),
      scope: tokenData.scope,
    });

    await createSession({
      userId: user.id,
      githubUserId: githubUser.id,
      username: githubUser.login,
    });

    const response = NextResponse.redirect(`${appUrl}/dashboard`);
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    console.error("[oauth/callback]", error);
    return NextResponse.redirect(`${appUrl}/?auth_error=callback_failed`);
  }
}
