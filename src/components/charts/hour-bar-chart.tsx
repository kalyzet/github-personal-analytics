"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface HourPoint {
  label: string;
  count: number;
}

export default function HourBarChart({ data }: { data: HourPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#71717A", fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: "#27272A" }}
          interval={1}
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
          cursor={{ fill: "#1F1F23" }}
        />
        <Bar dataKey="count" name="Commits" fill="#06B6D4" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
