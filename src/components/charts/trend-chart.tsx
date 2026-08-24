"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendPoint {
  date: string;
  label: string;
  value: number;
}

export default function TrendChart({
  data,
  color = "#8B5CF6",
}: {
  data: TrendPoint[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id={`grad-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#71717A", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#27272A" }}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "#71717A", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#18181B",
            border: "1px solid #3F3F46",
            borderRadius: 8,
            fontSize: 12,
            color: "#FAFAFA",
          }}
          labelStyle={{ color: "#A1A1AA" }}
          cursor={{ stroke: "#3F3F46" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          name="Aktivitas"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.slice(1)})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
