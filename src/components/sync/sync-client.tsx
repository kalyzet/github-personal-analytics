"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface SyncJob {
  id: number;
  type: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  repositoriesScanned: number;
  recordsCreated: number;
  recordsUpdated: number;
  errorMessage: string | null;
}

interface StatusResponse {
  latestJob: SyncJob | null;
  running: boolean;
  history: SyncJob[];
  stats: {
    repositories: number;
    commits: number;
    pullRequests: number;
    issues: number;
  };
  rateLimit: {
    remaining: number;
    limit: number;
    resetAt: string | null;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "text-[#22C55E]",
  FAILED: "text-[#EF4444]",
  RUNNING: "text-[#F59E0B]",
  PENDING: "text-zinc-400",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID");
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Belum pernah";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export default function SyncClient() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/sync/status", { cache: "no-store" });
      if (!response.ok) return;
      setStatus((await response.json()) as StatusResponse);
    } catch {
      // keep previous state on transient errors
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/sync/status", { cache: "no-store" });
        if (!response.ok || !active) return;
        const data = (await response.json()) as StatusResponse;
        if (active) setStatus(data);
      } catch {
        // keep previous state on transient errors
      }
    };

    void load();
    const interval = setInterval(load, status?.running ? 2000 : 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [status?.running]);

  async function startSync(type?: "FULL") {
    setStarting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/sync/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(type ? { type } : {}),
      });
      if (response.status === 409) {
        setMessage("Sinkronisasi sedang berjalan.");
      } else if (!response.ok) {
        setMessage("Gagal memulai sinkronisasi.");
      }
    } catch {
      setMessage("Gagal memulai sinkronisasi.");
    } finally {
      setStarting(false);
      void fetchStatus();
    }
  }

  return (
    <main className="min-h-screen bg-[#09090B] p-8 text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">GitHub Sync</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Last sync:{" "}
              {status
                ? formatRelative(status.latestJob?.startedAt ?? null)
                : "..."}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-[#27272A] px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-[#3F3F46] hover:text-zinc-100"
          >
            Dashboard
          </Link>
        </div>

        <section className="rounded-xl border border-[#27272A] bg-[#111113] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  status?.running
                    ? "animate-pulse bg-[#F59E0B]"
                    : "bg-[#22C55E]"
                }`}
              />
              <span className="text-zinc-300">
                {status?.running ? "Syncing..." : "Connected"}
              </span>
              {status?.latestJob && !status.running && (
                <span className={STATUS_COLORS[status.latestJob.status]}>
                  ({status.latestJob.status})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void startSync()}
                disabled={starting || Boolean(status?.running)}
                className="rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status?.running ? "Syncing..." : starting ? "Starting..." : "Sync Now"}
              </button>
              <button
                onClick={() => void startSync("FULL")}
                disabled={starting || Boolean(status?.running)}
                title="Ambil ulang seluruh histori"
                className="rounded-lg border border-[#27272A] px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-[#3F3F46] hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Full Resync
              </button>
            </div>
          </div>
          {message && (
            <p className="mt-3 text-xs text-[#F59E0B]">{message}</p>
          )}
          {status?.latestJob?.errorMessage && (
            <p className="mt-3 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
              {status.latestJob.errorMessage}
            </p>
          )}
          {status?.rateLimit && (
            <p className="mt-3 text-xs text-zinc-500">
              API usage: {status.rateLimit.remaining} / {status.rateLimit.limit}{" "}
              requests tersisa
            </p>
          )}
        </section>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              ["Repositories", status?.stats.repositories],
              ["Commits", status?.stats.commits],
              ["Pull Requests", status?.stats.pullRequests],
              ["Issues", status?.stats.issues],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[#27272A] bg-[#111113] p-4"
            >
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                {label}
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-zinc-50">
                {value ?? "-"}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-[#27272A] bg-[#111113]">
          <h2 className="border-b border-[#27272A] px-5 py-3 text-sm font-semibold text-zinc-300">
            Sync History
          </h2>
          {status && status.history.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-zinc-500">
              Belum ada riwayat sinkronisasi.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-2 font-medium">Waktu</th>
                  <th className="px-5 py-2 font-medium">Tipe</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Data Diproses</th>
                </tr>
              </thead>
              <tbody>
                {status?.history.map((job) => (
                  <tr key={job.id} className="border-t border-[#27272A]/50">
                    <td className="px-5 py-2.5 text-zinc-400">
                      {formatDateTime(job.startedAt)}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-xs text-zinc-400">
                      {job.type}
                    </td>
                    <td
                      className={`px-5 py-2.5 ${STATUS_COLORS[job.status] ?? ""}`}
                    >
                      {job.status === "RUNNING"
                        ? "Running..."
                        : job.status === "SUCCESS"
                          ? `✓ Success`
                          : job.status === "FAILED"
                            ? "× Failed"
                            : job.status}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-zinc-400">
                      {job.status === "SUCCESS" ||
                      job.status === "RUNNING" ||
                      job.recordsCreated > 0
                        ? `+${job.recordsCreated.toLocaleString("id-ID")} records · ${job.repositoriesScanned} repos`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
