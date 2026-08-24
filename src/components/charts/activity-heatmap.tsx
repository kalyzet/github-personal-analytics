"use client";

import { useState } from "react";

export interface HeatmapPoint {
  date: string;
  total: number;
}

function intensityLevel(total: number, max: number): number {
  if (total === 0) return 0;
  const ratio = total / Math.max(1, max);
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

const LEVEL_COLORS = [
  "bg-surface-hover",
  "bg-accent/25",
  "bg-accent/45",
  "bg-accent/70",
  "bg-accent",
];

export default function ActivityHeatmap({ points }: { points: HeatmapPoint[] }) {
  const [hovered, setHovered] = useState<HeatmapPoint | null>(null);

  const byDate = new Map(points.map((p) => [p.date, p.total]));
  const max = Math.max(1, ...points.map((p) => p.total));

  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-text-muted">
        Belum ada aktivitas untuk ditampilkan.
      </p>
    );
  }

  // Build flat cell list starting from the Sunday before the first date,
  // then chunk into week columns of 7 days.
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(`${sorted[0].date}T00:00:00Z`);
  const last = new Date(`${sorted[sorted.length - 1].date}T00:00:00Z`);
  const start = new Date(first);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  type Cell = { date: string; total: number } | null;
  const cells: Cell[] = [];
  const cursor = new Date(start);
  while (cursor <= last) {
    if (cursor < first) {
      cells.push(null);
    } else {
      const key = cursor.toISOString().slice(0, 10);
      cells.push({ date: key, total: byDate.get(key) ?? 0 });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Cell[] = [];
  void weeks;
  const weekColumns: Array<Cell[]> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weekColumns.push(cells.slice(i, i + 7));
  }

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weekColumns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) =>
              day ? (
                <button
                  key={day.date}
                  title={`${day.date}: ${day.total} aktivitas`}
                  onMouseEnter={() => setHovered(day)}
                  onMouseLeave={() => setHovered(null)}
                  className={`h-[13px] w-[13px] rounded-[3px] ${
                    LEVEL_COLORS[intensityLevel(day.total, max)]
                  } transition-colors hover:ring-1 hover:ring-border-strong`}
                  aria-label={`${day.date}: ${day.total} aktivitas`}
                />
              ) : (
                <div key={`${wi}-${di}`} className="h-[13px] w-[13px]" />
              ),
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="h-4 text-xs text-text-secondary">
          {hovered
            ? `${hovered.date} · ${hovered.total} aktivitas`
            : "\u00A0"}
        </p>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          Kurang
          {LEVEL_COLORS.map((color) => (
            <span key={color} className={`h-[10px] w-[10px] rounded-[2px] ${color}`} />
          ))}
          Banyak
        </div>
      </div>
    </div>
  );
}
