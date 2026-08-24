import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[#09090B] px-8">
      <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <span className="text-3xl text-[#8B5CF6]">◈</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            GitHub Personal Analytics
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Observatorium pribadi untuk memantau perkembangan aktivitas coding
            kamu sebagai developer.
          </p>
        </div>

        {session ? (
          <a
            href="/dashboard"
            className="rounded-lg bg-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED]"
          >
            Buka Dashboard
          </a>
        ) : (
          <a
            href="/api/auth/github/login"
            className="rounded-lg bg-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED]"
          >
            Connect GitHub
          </a>
        )}

        {session ? null : (
          <p className="text-xs text-zinc-600">
            Data disimpan lokal di perangkat kamu. Tidak ada yang dikirim ke
            server lain.
          </p>
        )}
      </main>
    </div>
  );
}
