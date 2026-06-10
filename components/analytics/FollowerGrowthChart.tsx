// Follower growth bar chart using Recharts.
"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";

const data = [
  { platform: "Twitter", followers: 2400 },
  { platform: "LinkedIn", followers: 1800 },
  { platform: "Instagram", followers: 3600 },
  { platform: "Facebook", followers: 2100 }
];

export function FollowerGrowthChart() {
  return (
    <Card className="h-80">
      <CardTitle>Follower growth</CardTitle>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <XAxis dataKey="platform" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="followers" fill="#14b8a6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
