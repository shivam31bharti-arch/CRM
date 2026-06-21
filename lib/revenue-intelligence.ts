import { CampaignStatus, ContactStatus, DealStage, PostStatus } from "@prisma/client";
import { db } from "@/lib/db";

type Priority = "Critical" | "High" | "Medium" | "Low";

export type RevenueMetric = {
  label: string;
  value: string;
  helper: string;
};

export type NextBestAction = {
  title: string;
  description: string;
  priority: Priority;
  href: string;
  impact: string;
};

export type RiskSignal = {
  label: string;
  value: string;
  tone: "red" | "amber" | "emerald" | "blue";
  description: string;
};

export type StrategicGap = {
  title: string;
  unmetNeed: string;
  solution: string;
  status: string;
};

export type RevenueCommandCenter = {
  metrics: RevenueMetric[];
  nextActions: NextBestAction[];
  riskSignals: RiskSignal[];
  strategicGaps: StrategicGap[];
  channelRoi: {
    impressions: number;
    clicks: number;
    engagements: number;
    activeCampaigns: number;
    scheduledPosts: number;
  };
  pipeline: {
    openDeals: number;
    totalValue: number;
    weightedForecast: number;
    overdueDeals: number;
    closingSoonDeals: number;
  };
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-US");

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function ageInHours(date?: Date | null) {
  if (!date) return 0;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60)));
}

function emptyCommandCenter(): RevenueCommandCenter {
  return {
    metrics: [
      { label: "Open pipeline", value: "$0", helper: "No deal data available yet." },
      { label: "Weighted forecast", value: "$0", helper: "Add probabilities to forecast revenue." },
      { label: "Response SLA", value: "0h", helper: "No unread customer messages." },
      {
        label: "Channel health",
        value: "0 scheduled",
        helper: "Connect channels and schedule posts."
      }
    ],
    nextActions: [
      {
        title: "Import customers and deals",
        description:
          "Load the current book of business so the command center can prioritize revenue work.",
        priority: "High",
        href: "/contacts",
        impact: "Creates the operating baseline"
      }
    ],
    riskSignals: [
      {
        label: "Data foundation",
        value: "Empty",
        tone: "blue",
        description: "The intelligence layer is ready once CRM data is available."
      }
    ],
    strategicGaps: buildStrategicGaps({
      oldestUnreadHours: 0,
      ownerlessLeads: 0,
      activeCampaigns: 0
    }),
    channelRoi: {
      impressions: 0,
      clicks: 0,
      engagements: 0,
      activeCampaigns: 0,
      scheduledPosts: 0
    },
    pipeline: {
      openDeals: 0,
      totalValue: 0,
      weightedForecast: 0,
      overdueDeals: 0,
      closingSoonDeals: 0
    }
  };
}

function priorityRank(priority: Priority) {
  return { Critical: 0, High: 1, Medium: 2, Low: 3 }[priority];
}

function buildStrategicGaps({
  oldestUnreadHours,
  ownerlessLeads,
  activeCampaigns
}: {
  oldestUnreadHours: number;
  ownerlessLeads: number;
  activeCampaigns: number;
}): StrategicGap[] {
  return [
    {
      title: "Speed-to-lead for consumer conversations",
      unmetNeed: "Large CRMs often bury social DMs, mentions, and comments away from revenue work.",
      solution:
        "Unify inbox urgency with CRM ownership so high-intent consumers get a fast human response.",
      status: oldestUnreadHours > 24 ? `${oldestUnreadHours}h oldest unread` : "Covered"
    },
    {
      title: "Operator-grade guidance without RevOps overhead",
      unmetNeed: "Small teams need the next action, not another dashboard to configure.",
      solution:
        "Score owner gaps, stale deals, failed posts, and campaign coverage into one daily action list.",
      status: ownerlessLeads > 0 ? `${ownerlessLeads} leads need owners` : "Covered"
    },
    {
      title: "Social content tied to revenue movement",
      unmetNeed: "Top platforms separate marketing engagement from pipeline execution.",
      solution:
        "Connect scheduled posts, campaigns, contacts, deals, and analytics in the same workspace.",
      status: activeCampaigns > 0 ? `${activeCampaigns} active campaigns` : "Needs activation"
    }
  ];
}

export async function getRevenueCommandCenter(): Promise<RevenueCommandCenter> {
  try {
    const now = new Date();
    const last30Days = daysAgo(30);
    const next7Days = daysFromNow(7);

    const [
      openDeals,
      overdueDeals,
      closingSoonDeals,
      ownerlessLeads,
      unreadInbox,
      oldestUnread,
      failedPosts,
      scheduledPosts,
      activeCampaigns,
      disconnectedChannels,
      postAnalytics
    ] = await Promise.all([
      db.deal.findMany({
        where: { stage: { notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] } },
        select: {
          id: true,
          title: true,
          value: true,
          probability: true,
          stage: true,
          closeDate: true,
          updatedAt: true,
          contact: { select: { firstName: true, lastName: true, company: true } },
          assignedTo: { select: { name: true } }
        },
        orderBy: [{ closeDate: "asc" }, { value: "desc" }],
        take: 75
      }),
      db.deal.count({
        where: {
          stage: { notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] },
          closeDate: { lt: now }
        }
      }),
      db.deal.count({
        where: {
          stage: { notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] },
          closeDate: { gte: now, lte: next7Days }
        }
      }),
      db.contact.count({
        where: {
          assignedToId: null,
          status: { in: [ContactStatus.LEAD, ContactStatus.PROSPECT] }
        }
      }),
      db.inboxItem.count({ where: { isRead: false } }),
      db.inboxItem.findFirst({
        where: { isRead: false },
        select: { receivedAt: true, senderName: true, platform: true, type: true },
        orderBy: { receivedAt: "asc" }
      }),
      db.post.count({ where: { status: PostStatus.FAILED } }),
      db.post.count({ where: { status: PostStatus.SCHEDULED } }),
      db.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
      db.socialAccount.count({ where: { isActive: false } }),
      db.postAnalytic.aggregate({
        where: { recordedAt: { gte: last30Days } },
        _sum: {
          clicks: true,
          comments: true,
          impressions: true,
          likes: true,
          shares: true
        }
      })
    ]);

    const totalValue = openDeals.reduce((sum, deal) => sum + deal.value, 0);
    const weightedForecast = openDeals.reduce(
      (sum, deal) => sum + deal.value * (deal.probability / 100),
      0
    );
    const oldestUnreadHours = ageInHours(oldestUnread?.receivedAt);
    const engagements =
      (postAnalytics._sum.likes ?? 0) +
      (postAnalytics._sum.comments ?? 0) +
      (postAnalytics._sum.shares ?? 0);

    const nextActions: NextBestAction[] = [
      unreadInbox > 0
        ? {
            title: "Clear high-intent customer messages",
            description: oldestUnread
              ? `${oldestUnread.senderName} has waited ${oldestUnreadHours}h on ${oldestUnread.platform.toLowerCase()}.`
              : `${unreadInbox} customer conversations are waiting.`,
            priority: oldestUnreadHours > 24 ? "Critical" : "High",
            href: "/inbox",
            impact: "Protects response SLA and captures warm demand"
          }
        : null,
      overdueDeals > 0
        ? {
            title: "Rescue overdue revenue",
            description: `${overdueDeals} open deals are past close date and need a next step or a clean loss reason.`,
            priority: "Critical",
            href: "/deals",
            impact: "Improves forecast accuracy this week"
          }
        : null,
      ownerlessLeads > 0
        ? {
            title: "Assign unowned leads",
            description: `${ownerlessLeads} leads or prospects have no owner, which slows consumer follow-up.`,
            priority: "High",
            href: "/contacts",
            impact: "Reduces leakage before qualification"
          }
        : null,
      failedPosts > 0
        ? {
            title: "Repair failed publishing",
            description: `${failedPosts} posts failed to publish. Fixing them restores campaign consistency.`,
            priority: "High",
            href: "/scheduler",
            impact: "Keeps acquisition channels live"
          }
        : null,
      closingSoonDeals > 0
        ? {
            title: "Prepare close plans",
            description: `${closingSoonDeals} deals close in the next 7 days. Confirm owner, buyer concern, and next meeting.`,
            priority: "Medium",
            href: "/deals",
            impact: "Raises win probability on near-term pipeline"
          }
        : null,
      activeCampaigns === 0
        ? {
            title: "Activate a revenue campaign",
            description:
              "Create one campaign that links a target segment, scheduled posts, and the deals it should influence.",
            priority: "Medium",
            href: "/campaigns",
            impact: "Turns content work into measurable pipeline"
          }
        : null,
      disconnectedChannels > 0
        ? {
            title: "Reconnect inactive channels",
            description: `${disconnectedChannels} connected social accounts are inactive and may block inbox or publishing flows.`,
            priority: "Medium",
            href: "/settings/integrations",
            impact: "Prevents silent channel failures"
          }
        : null
    ].filter((action): action is NextBestAction => Boolean(action));

    if (nextActions.length === 0) {
      nextActions.push({
        title: "Expand the highest-performing customer segment",
        description:
          "Use current campaign and deal data to pick one segment for a focused nurture sequence.",
        priority: "Low",
        href: "/campaigns",
        impact: "Compounds what is already working"
      });
    }

    const riskSignals: RiskSignal[] = [
      {
        label: "Response SLA",
        value: unreadInbox > 0 ? `${oldestUnreadHours}h` : "Clean",
        tone: oldestUnreadHours > 24 ? "red" : unreadInbox > 0 ? "amber" : "emerald",
        description:
          unreadInbox > 0
            ? `${unreadInbox} unread conversations need triage.`
            : "No unread inbox items."
      },
      {
        label: "Forecast risk",
        value: overdueDeals > 0 ? `${overdueDeals} overdue` : "Current",
        tone: overdueDeals > 0 ? "red" : closingSoonDeals > 0 ? "amber" : "emerald",
        description:
          closingSoonDeals > 0
            ? `${closingSoonDeals} deals are closing in the next week.`
            : "No near-term close pressure."
      },
      {
        label: "Lead ownership",
        value: ownerlessLeads > 0 ? `${ownerlessLeads} open` : "Covered",
        tone: ownerlessLeads > 0 ? "amber" : "emerald",
        description: "Every lead should have a directly accountable owner."
      },
      {
        label: "Channel reliability",
        value: failedPosts > 0 ? `${failedPosts} failed` : "Healthy",
        tone: failedPosts > 0 || disconnectedChannels > 0 ? "amber" : "emerald",
        description:
          disconnectedChannels > 0
            ? `${disconnectedChannels} social accounts are inactive.`
            : "Publishing and social account health look stable."
      }
    ];

    return {
      metrics: [
        {
          label: "Open pipeline",
          value: currencyFormatter.format(totalValue),
          helper: `${openDeals.length} active opportunities`
        },
        {
          label: "Weighted forecast",
          value: currencyFormatter.format(weightedForecast),
          helper: "Probability-adjusted revenue"
        },
        {
          label: "Response SLA",
          value: unreadInbox > 0 ? `${oldestUnreadHours}h` : "0h",
          helper: unreadInbox > 0 ? `${unreadInbox} unread conversations` : "Inbox is clear"
        },
        {
          label: "Channel health",
          value: `${scheduledPosts} scheduled`,
          helper: `${numberFormatter.format(postAnalytics._sum.clicks ?? 0)} clicks in 30 days`
        }
      ],
      nextActions: nextActions
        .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
        .slice(0, 6),
      riskSignals,
      strategicGaps: buildStrategicGaps({ oldestUnreadHours, ownerlessLeads, activeCampaigns }),
      channelRoi: {
        impressions: postAnalytics._sum.impressions ?? 0,
        clicks: postAnalytics._sum.clicks ?? 0,
        engagements,
        activeCampaigns,
        scheduledPosts
      },
      pipeline: {
        openDeals: openDeals.length,
        totalValue,
        weightedForecast,
        overdueDeals,
        closingSoonDeals
      }
    };
  } catch {
    return emptyCommandCenter();
  }
}
