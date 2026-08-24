import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import AppShell from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  const [user] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.githubUserId, session.githubUserId))
    .limit(1);

  return (
    <AppShell username={session.username} avatarUrl={user?.avatarUrl ?? null}>
      {children}
    </AppShell>
  );
}
