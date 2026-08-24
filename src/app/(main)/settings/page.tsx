import { eq } from "drizzle-orm";
import DangerZone from "@/components/settings/danger-zone";
import { Card, CardTitle } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { githubAccounts, users } from "@/lib/db/schema";
import { formatDate, formatRelative } from "@/lib/utils/format";
import { getLatestSyncJob } from "@/lib/db/repositories/sync";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;

  const latestJob = await getLatestSyncJob(session.userId);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.githubUserId, session.githubUserId))
    .limit(1);
  const [account] = await db
    .select({
      username: githubAccounts.username,
      scope: githubAccounts.scope,
      connectedAt: githubAccounts.connectedAt,
    })
    .from(githubAccounts)
    .where(eq(githubAccounts.userId, session.userId))
    .limit(1);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold tracking-tight">Settings</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Account</CardTitle>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Username</dt>
              <dd className="font-mono">@{session.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Display name</dt>
              <dd>{user?.displayName ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Akun GitHub dibuat</dt>
              <dd>
                {user?.githubCreatedAt ? formatDate(user.githubCreatedAt) : "-"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle>GitHub Connection</CardTitle>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Status</dt>
              <dd className="flex items-center gap-1.5 text-positive">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
                {account ? "Connected" : "Not connected"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Terhubung sejak</dt>
              <dd>
                {account?.connectedAt ? formatDate(account.connectedAt) : "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Scope token</dt>
              <dd className="font-mono text-xs">{account?.scope ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Token storage</dt>
              <dd>AES-256-GCM terenkripsi (lokal)</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card>
        <CardTitle>Data & Privacy</CardTitle>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-secondary">
          <li>Seluruh data disimpan lokal di SQLite di perangkat kamu.</li>
          <li>Token GitHub tidak pernah dikirim ke browser.</li>
          <li>
            Last sync:{" "}
            {latestJob ? formatRelative(latestJob.startedAt) : "Belum pernah"}
          </li>
        </ul>
      </Card>

      <DangerZone />
    </div>
  );
}
