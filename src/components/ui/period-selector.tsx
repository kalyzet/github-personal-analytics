"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const PERIODS = [
  { key: "7d", label: "7H" },
  { key: "30d", label: "30H" },
  { key: "90d", label: "90H" },
  { key: "1y", label: "1T" },
] as const;

export default function PeriodSelector() {
  const searchParams = useSearchParams();
  const current = searchParams.get("period") ?? "30d";

  return (
    <div className="flex rounded-lg border border-border-default bg-surface p-0.5">
      {PERIODS.map((period) => (
        <Link
          key={period.key}
          href={`?period=${period.key}`}
          scroll={false}
          className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
            current === period.key
              ? "bg-accent/20 font-medium text-accent"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          {period.label}
        </Link>
      ))}
    </div>
  );
}
