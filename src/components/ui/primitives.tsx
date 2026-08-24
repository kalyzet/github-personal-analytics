import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border-default bg-surface p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
      {children}
    </h2>
  );
}

export function MetricCard({
  label,
  value,
  changePercent,
  hint,
}: {
  label: string;
  value: number | string;
  changePercent?: number | null;
  hint?: string;
}) {
  const hasChange =
    changePercent !== undefined && changePercent !== null && isFinite(changePercent);
  return (
    <div className="rounded-xl border border-border-default bg-surface p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold text-text-primary sm:text-3xl">
        {value}
      </p>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {hasChange ? (
          <>
            <span
              className={
                (changePercent as number) >= 0 ? "text-positive" : "text-danger"
              }
            >
              {(changePercent as number) >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(changePercent as number).toFixed(1)}%
            </span>
            <span className="text-text-muted">vs periode lalu</span>
          </>
        ) : (
          hint && <span className="text-text-muted">{hint}</span>
        )}
      </div>
    </div>
  );
}

export function ProgressBar({
  percent,
  color = "bg-accent",
}: {
  percent: number;
  color?: string;
}) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
      <div
        className={`h-full rounded-full ${color} transition-all duration-200`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function StatusBadge({ label, tone }: { label: string; tone: string }) {
  const tones: Record<string, string> = {
    positive: "border-positive/40 bg-positive/10 text-positive",
    muted: "border-border-default bg-surface-hover text-text-secondary",
    warning: "border-warning/40 bg-warning/10 text-warning",
    danger: "border-danger/40 bg-danger/10 text-danger",
    accent: "border-accent/40 bg-accent/10 text-accent",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone] ?? tones.muted}`}
    >
      {label}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="text-xl text-text-muted">◈</span>
      <p className="max-w-xs text-sm text-text-muted">{message}</p>
    </div>
  );
}
