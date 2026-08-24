import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAccountByUserId } from "@/lib/db/repositories/users";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const account = await getAccountByUserId(session.userId);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Dashboard Placeholder
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-100">
          Halo, @{session.username}
        </h1>
        <dl className="mt-4 space-y-1 text-sm text-zinc-400">
          <div className="flex justify-between">
            <dt>User ID</dt>
            <dd className="font-mono text-zinc-200">{session.userId}</dd>
          </div>
          <div className="flex justify-between">
            <dt>GitHub User ID</dt>
            <dd className="font-mono text-zinc-200">{session.githubUserId}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Token tersimpan</dt>
            <dd className={account ? "text-green-500" : "text-red-500"}>
              {account ? "✓ encrypted" : "✗ missing"}
            </dd>
          </div>
        </dl>
      </div>
      <Link
        href="/api/auth/github/logout"
        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
      >
        Logout
      </Link>
    </main>
  );
}
