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

const STATUS_COLORS: Record<string, string> = {
  pending: "#AF5071",
  processing: "#D8ABBB",
  shipped: "#B58B45",
  delivered: "#5E9475",
  cancelled: "#CE2B21",
};

export function OrdersOverTimeChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => value.slice(5)}
          fontSize={12}
          interval={4}
        />
        <YAxis allowDecimals={false} fontSize={12} width={30} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#AF5071" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TopProductsChart({ data }: { data: { name: string; salesCount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} fontSize={12} />
        <YAxis type="category" dataKey="name" width={120} fontSize={12} />
        <Tooltip />
        <Bar dataKey="salesCount" fill="#AF5071" radius={4} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OrderStatusDonutChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#ccc"} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
