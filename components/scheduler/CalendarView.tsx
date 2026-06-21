"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LayoutGrid,
  List,
  Plus,
  Send,
  Sparkles
} from "lucide-react";
import { PostCard, type PostRow } from "@/components/scheduler/PostCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

type ViewMode = "calendar" | "list";
const EMPTY_POSTS: PostRow[] = [];

const platformStyles: Record<string, string> = {
  TWITTER: "border-sky-200 bg-sky-50 text-sky-800",
  LINKEDIN: "border-blue-200 bg-blue-50 text-blue-800",
  INSTAGRAM: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
  FACEBOOK: "border-indigo-200 bg-indigo-50 text-indigo-800"
};

const platformLabels: Record<string, string> = {
  TWITTER: "X / Twitter",
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook"
};

function getPostDate(post: PostRow) {
  const value = post.scheduledAt ?? post.publishedAt;
  return value ? new Date(value) : null;
}

export function CalendarView() {
  const [view, setView] = useState<ViewMode>("calendar");
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [platform, setPlatform] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const { data, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => (await fetch("/api/posts")).json()
  });

  const posts: PostRow[] = data?.items ?? EMPTY_POSTS;
  const filteredPosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          (platform === "ALL" || post.platform === platform) &&
          (status === "ALL" || post.status === status)
      ),
    [platform, posts, status]
  );

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth));
    const end = endOfWeek(endOfMonth(visibleMonth));
    const days = [];
    for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
    return days;
  }, [visibleMonth]);

  const selectedPosts = filteredPosts.filter((post) => {
    const postDate = getPostDate(post);
    return postDate ? isSameDay(postDate, selectedDay) : false;
  });
  const scheduledCount = posts.filter((post) => post.status === "SCHEDULED").length;
  const publishedCount = posts.filter((post) => post.status === "PUBLISHED").length;
  const failedCount = posts.filter((post) => post.status === "FAILED").length;
  const nextPost = posts
    .filter((post) => post.status === "SCHEDULED" && getPostDate(post))
    .sort((a, b) => getPostDate(a)!.getTime() - getPostDate(b)!.getTime())[0];

  if (isLoading) return <LoadingState rows={6} />;

  const returnToToday = () => {
    const today = new Date();
    setVisibleMonth(startOfMonth(today));
    setSelectedDay(today);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Clock3}
          label="Ready to publish"
          value={scheduledCount}
          detail="Scheduled posts"
          tone="blue"
        />
        <SummaryCard
          icon={Send}
          label="Published"
          value={publishedCount}
          detail="All-time delivery"
          tone="green"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Needs attention"
          value={failedCount}
          detail={failedCount ? "Review failed posts" : "No delivery issues"}
          tone="red"
        />
        <SummaryCard
          icon={Sparkles}
          label="Next up"
          value={nextPost ? format(getPostDate(nextPost)!, "MMM d") : "Open"}
          detail={nextPost ? format(getPostDate(nextPost)!, "h:mm a") : "Build your content queue"}
          tone="amber"
        />
      </div>

      <div className="flex flex-col gap-3 border-y border-slate-200 bg-white/60 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex h-9 items-center rounded-md border bg-white p-1"
            aria-label="Scheduler view"
          >
            <button
              type="button"
              aria-label="Calendar view"
              title="Calendar view"
              className={cn(
                "focus-ring flex h-7 w-8 items-center justify-center rounded",
                view === "calendar"
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              )}
              onClick={() => setView("calendar")}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="List view"
              title="List view"
              className={cn(
                "focus-ring flex h-7 w-8 items-center justify-center rounded",
                view === "list" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"
              )}
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <Select
            className="w-36"
            aria-label="Filter by platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
          >
            <option value="ALL">All platforms</option>
            {Object.entries(platformLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            className="w-32"
            aria-label="Filter by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="FAILED">Failed</option>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button variant="ghost" onClick={returnToToday}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              className="w-9 px-0"
              aria-label="Previous month"
              title="Previous month"
              onClick={() => setVisibleMonth(subMonths(visibleMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <p className="w-36 text-center text-sm font-semibold text-slate-950">
              {format(visibleMonth, "MMMM yyyy")}
            </p>
            <Button
              variant="secondary"
              className="w-9 px-0"
              aria-label="Next month"
              title="Next month"
              onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {view === "list" ? (
        filteredPosts.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <SchedulerEmptyState />
        )
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-card">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-7 border-b bg-slate-50/80">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="px-3 py-2 text-xs font-semibold uppercase text-slate-500"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dayPosts = filteredPosts.filter((post) => {
                    const postDate = getPostDate(post);
                    return postDate ? isSameDay(postDate, day) : false;
                  });
                  const selected = isSameDay(day, selectedDay);
                  return (
                    <button
                      type="button"
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "focus-ring min-h-32 border-b border-r p-2 text-left align-top transition hover:bg-slate-50",
                        !isSameMonth(day, visibleMonth) && "bg-slate-50/60 text-slate-400",
                        selected && "bg-red-50/60 ring-2 ring-inset ring-primary/40"
                      )}
                    >
                      <span
                        className={cn(
                          "mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                          isToday(day) && "bg-primary text-white",
                          selected && !isToday(day) && "bg-slate-950 text-white"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <span className="space-y-1">
                        {dayPosts.slice(0, 3).map((post) => (
                          <span
                            key={post.id}
                            className={cn(
                              "block truncate rounded border px-2 py-1 text-xs font-medium",
                              platformStyles[post.platform] ??
                                "border-slate-200 bg-slate-50 text-slate-700"
                            )}
                          >
                            {format(getPostDate(post)!, "h:mm a")} · {post.body}
                          </span>
                        ))}
                        {dayPosts.length > 3 ? (
                          <span className="block px-1 text-xs font-medium text-slate-500">
                            +{dayPosts.length - 3} more
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3 border-b pb-3">
              <div>
                <p className="text-xs font-semibold uppercase text-primary">Daily agenda</p>
                <h2 className="mt-1 text-base font-semibold text-slate-950">
                  {format(selectedDay, "EEEE, MMMM d")}
                </h2>
              </div>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-md bg-slate-950 px-2 text-xs font-bold text-white">
                {selectedPosts.length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {selectedPosts.length ? (
                selectedPosts.map((post) => <PostCard key={post.id} post={post} compact />)
              ) : (
                <AgendaEmpty />
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number | string;
  detail: string;
  tone: "blue" | "green" | "red" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700"
  };
  return (
    <Card className="flex items-center gap-3 p-3">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
          colors[tone]
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold text-slate-950">{value}</p>
          <p className="truncate text-xs text-slate-500">{detail}</p>
        </div>
      </div>
    </Card>
  );
}

function AgendaEmpty() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed bg-slate-50 p-5 text-center">
      <CalendarDays className="h-7 w-7 text-slate-400" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-slate-900">This day is clear</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Use the open space to keep your publishing rhythm consistent.
      </p>
      <Link href="/scheduler/compose" className="mt-4">
        <Button variant="secondary">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add post
        </Button>
      </Link>
    </div>
  );
}

function SchedulerEmptyState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-8 text-center">
      <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold text-slate-950">
        Your content queue is wide open
      </h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
        Create the first post, choose a channel and time, and it will appear here automatically.
      </p>
      <Link href="/scheduler/compose" className="mt-4">
        <Button>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create first post
        </Button>
      </Link>
    </div>
  );
}
