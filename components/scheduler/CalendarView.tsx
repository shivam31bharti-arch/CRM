// Calendar view with month, week, day, and list modes for scheduled posts.
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { PostCard, type PostRow } from "@/components/scheduler/PostCard";

export function CalendarView() {
  const [mode, setMode] = useState<"month" | "week" | "day" | "list">("month");
  const { data, isLoading } = useQuery({ queryKey: ["posts"], queryFn: async () => (await fetch("/api/posts")).json() });
  const posts: PostRow[] = data?.items ?? [];
  const days = Array.from({ length: mode === "month" ? 30 : mode === "week" ? 7 : 1 }, (_, i) => addDays(startOfMonth(new Date()), i));
  if (isLoading) return <LoadingState rows={5} />;
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["month", "week", "day", "list"] as const).map((item) => (
          <Button key={item} variant={mode === item ? "primary" : "secondary"} onClick={() => setMode(item)}>
            {item}
          </Button>
        ))}
      </div>
      {posts.length === 0 ? <EmptyState title="No posts scheduled" body="Compose a post to see it on the calendar." /> : null}
      {mode === "list" ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>
      ) : (
        <div className="grid gap-2 md:grid-cols-7">
          {days.map((day) => (
            <section key={day.toISOString()} className="min-h-36 rounded-lg border bg-white p-2">
              <p className="mb-2 text-xs font-semibold text-slate-500">{format(day, "MMM d")}</p>
              <div className="space-y-2">
                {posts
                  .filter((post) => post.scheduledAt?.slice(0, 10) === day.toISOString().slice(0, 10))
                  .map((post) => <PostCard key={post.id} post={post} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
