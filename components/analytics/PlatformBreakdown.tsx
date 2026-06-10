// Platform reach breakdown donut chart.
"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";

const data = [
  { name: "Twitter", value: 31, color: "#2563eb" },
  { name: "LinkedIn", value: 24, color: "#14b8a6" },
  { name: "Instagram", value: 33, color: "#f59e0b" },
  { name: "Facebook", value: 12, color: "#64748b" }
];

export function PlatformBreakdown() {
  return (
    <Card className="h-80">
      <CardTitle>Reach by platform</CardTitle>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
