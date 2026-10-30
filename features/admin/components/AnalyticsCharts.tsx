"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/utils/format-currency";

const CATEGORY_COLORS = ["#AF5071", "#D8ABBB", "#B58B45", "#5E9475", "#4E3844", "#D4B073"];

export function RevenueOverTimeChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} fontSize={12} />
        <YAxis fontSize={12} width={60} tickFormatter={(v: number) => formatCurrency(v)} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Line type="monotone" dataKey="revenue" stroke="#AF5071" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TopProductsRankingChart({ data }: { data: { name: string; quantity: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical" margin={{ left: 32 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} fontSize={12} />
        <YAxis type="category" dataKey="name" width={140} fontSize={11} />
        <Tooltip />
        <Bar dataKey="quantity" fill="#AF5071" radius={4} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPerformanceChart({ data }: { data: { category: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="revenue" nameKey="category" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
      </PieChart>
    </ResponsiveContainer>
  );
}
