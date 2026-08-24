import { ProgressBar } from "./primitives";

export interface BarItem {
  label: string;
  value: string;
  percent: number;
  hint?: string;
}

export default function BarList({
  items,
  color = "bg-accent",
}: {
  items: BarItem[];
  color?: string;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-text-secondary">{item.label}</span>
            <span className="shrink-0 font-mono text-xs text-text-muted">
              {item.value}
              {item.hint ? ` · ${item.hint}` : ""}
            </span>
          </div>
          <ProgressBar percent={item.percent} color={color} />
        </li>
      ))}
    </ul>
  );
}
