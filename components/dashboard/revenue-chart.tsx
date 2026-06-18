"use client";

// This file is the ONLY place recharts is imported.
// dynamic(() => import('./revenue-chart')) in client.tsx ensures
// recharts (~200 kB) is split into its own lazy chunk and never
// blocks the initial page paint.
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { ChartPoint } from "@/lib/actions/dashboard";

export default function RevenueChart({ data }: { data: ChartPoint[] }) {
  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
        No revenue data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="cr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#0E7A52" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0E7A52" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#0E7A52"
          strokeWidth={2}
          fill="url(#cr)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
