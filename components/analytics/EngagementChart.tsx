// Engagement line chart using Recharts.
"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";

const data = Array.from({ length: 14 }, (_, i) => ({ day: `D${i + 1}`, TWITTER: 20 + i * 3, LINKEDIN: 16 + i * 2, INSTAGRAM: 25 + i * 4 }));

export function EngagementChart() {
  return (
    <Card className="h-80">
      <CardTitle>Engagement over time</CardTitle>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="TWITTER" stroke="#2563eb" strokeWidth={2} />
          <Line type="monotone" dataKey="LINKEDIN" stroke="#14b8a6" strokeWidth={2} />
          <Line type="monotone" dataKey="INSTAGRAM" stroke="#f59e0b" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
