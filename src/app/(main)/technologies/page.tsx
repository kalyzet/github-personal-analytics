import BarList from "@/components/ui/bar-list";
import PeriodSelector from "@/components/ui/period-selector";
import { Card, CardTitle, EmptyState } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth/session";
import { getLanguageDistribution } from "@/services/analytics/technologies";
import { parsePeriod } from "@/lib/utils/period";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default async function TechnologiesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const period = parsePeriod((await searchParams).period);
  void period;

  const languages = await getLanguageDistribution(session.userId);
  const dominant = languages[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Technologies</h1>
        <PeriodSelector />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardTitle>Language Distribution</CardTitle>
          <div className="mt-4">
            {languages.length === 0 ? (
              <EmptyState message="Belum ada data bahasa. Jalankan sync dulu." />
            ) : (
              <BarList
                items={languages.map((lang) => ({
                  label: lang.language,
                  value: `${lang.percentage.toFixed(1)}%`,
                  percent: lang.percentage,
                  hint: formatBytes(lang.bytes),
                }))}
                color="bg-cyan-accent"
              />
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardTitle>Bahasa Dominan</CardTitle>
            <p className="mt-2 text-2xl font-bold text-cyan-accent">
              {dominant?.language ?? "-"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              {dominant
                ? `Dominan dengan ${dominant.percentage.toFixed(1)}% dari total kode di ${dominant.repositoryCount} repository.`
                : "Jalankan sync untuk mengumpulkan data bahasa."}
            </p>
          </Card>

          <Card>
            <CardTitle>Diversity</CardTitle>
            <p className="mt-2 font-mono text-3xl font-bold">
              {languages.length}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              jumlah bahasa pemrograman terdeteksi di seluruh repository.
            </p>
          </Card>

          <Card>
            <CardTitle>Top Repos per Bahasa</CardTitle>
            <ul className="mt-3 space-y-2 text-sm">
              {languages.slice(0, 5).map((lang) => (
                <li key={lang.language} className="flex justify-between gap-2">
                  <span className="text-text-secondary">{lang.language}</span>
                  <span className="font-mono text-xs text-text-muted">
                    {lang.repositoryCount} repo
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
