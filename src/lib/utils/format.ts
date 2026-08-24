export function formatRelative(iso: Date | string | null | undefined): string {
  if (!iso) return "Belum pernah";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDate(iso: Date | string): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("id-ID");
}
