"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PendingAction = "disconnect" | "analytics" | "all" | null;

const ACTION_META = {
  disconnect: {
    title: "Disconnect GitHub?",
    description:
      "Koneksi GitHub akan diputus dan token akses dihapus. Data analytics yang sudah terkumpul tetap tersimpan. Kamu bisa connect kembali kapan saja.",
    confirmLabel: "Disconnect",
    tone: "warning" as const,
  },
  analytics: {
    title: "Hapus Semua Data Analytics?",
    description:
      "Seluruh data sinkronisasi (repositories, commits, PRs, issues, agregasi, riwayat sync) akan dihapus permanen dari database lokal. Akun tetap terhubung.",
    confirmLabel: "Hapus Data",
    tone: "danger" as const,
  },
  all: {
    title: "Hapus Akun & Seluruh Data?",
    description:
      "Koneksi GitHub diputus DAN seluruh data analytics dihapus permanen. Tindakan ini tidak dapat dibatalkan.",
    confirmLabel: "Hapus Permanen",
    tone: "danger" as const,
  },
} as const;

export default function DangerZone() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function execute(action: NonNullable<PendingAction>) {
    setBusy(true);
    setError(null);
    try {
      let response: Response;
      if (action === "disconnect") {
        response = await fetch("/api/settings", { method: "POST" });
      } else {
        response = await fetch(
          `/api/settings?scope=${action === "analytics" ? "analytics" : "all"}`,
          { method: "DELETE" },
        );
      }
      if (!response.ok) {
        throw new Error("Request gagal");
      }
      if (action === "disconnect" || action === "all") {
        await fetch("/api/auth/github/logout", { method: "POST" }).catch(() => {});
        router.push("/");
      } else {
        setPending(null);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-5">
        <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
        <div className="mt-3 space-y-3">
          {(
            [
              [
                "disconnect",
                "Disconnect GitHub",
                "Putuskan koneksi & hapus token akses",
              ],
              [
                "analytics",
                "Delete Analytics Data",
                "Hapus seluruh data sinkronisasi & agregasi",
              ],
              [
                "all",
                "Delete Account",
                "Disconnect + hapus seluruh data permanen",
              ],
            ] as const
          ).map(([action, label, description]) => (
            <div
              key={action}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-default bg-surface p-4"
            >
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-text-muted">{description}</p>
              </div>
              <button
                onClick={() => setPending(action)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  action === "disconnect"
                    ? "border border-warning/40 text-warning hover:bg-warning/10"
                    : "border border-danger/40 text-danger hover:bg-danger/10"
                }`}
              >
                {ACTION_META[action].confirmLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !busy && setPending(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border-strong bg-surface-elevated p-6">
            <h3 className="text-lg font-bold">
              {ACTION_META[pending].title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {ACTION_META[pending].description}
            </p>
            {error && <p className="mt-3 text-xs text-danger">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setPending(null)}
                disabled={busy}
                className="rounded-lg border border-border-default px-4 py-2 text-sm text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void execute(pending)}
                disabled={busy}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  ACTION_META[pending].tone === "danger"
                    ? "bg-danger hover:bg-danger/80"
                    : "bg-warning hover:bg-warning/80"
                }`}
              >
                {busy ? "Memproses..." : ACTION_META[pending].confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
