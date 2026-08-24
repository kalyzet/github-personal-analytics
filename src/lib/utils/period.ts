export type PeriodKey = "7d" | "30d" | "90d" | "1y";

const PERIOD_DAYS: Record<PeriodKey, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

export function parsePeriod(value: string | undefined | null): PeriodKey {
  if (value && value in PERIOD_DAYS) return value as PeriodKey;
  return "30d";
}

export function periodDays(period: PeriodKey): number {
  return PERIOD_DAYS[period];
}

export function periodRange(period: PeriodKey): {
  start: Date;
  end: Date;
  days: number;
} {
  const days = PERIOD_DAYS[period];
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { start, end, days };
}

export function previousRange(period: PeriodKey): { start: Date; end: Date } {
  const { start } = periodRange(period);
  const days = PERIOD_DAYS[period];
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  prevEnd.setHours(23, 59, 59, 999);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  prevStart.setHours(0, 0, 0, 0);
  return { start: prevStart, end: prevEnd };
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
