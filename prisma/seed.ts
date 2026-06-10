// Seed script for local demo data across CRM and social modules.
import { PrismaClient, Role, ContactStatus, DealStage, Platform, PostStatus, CampaignStatus, InboxType, ActivityType, NotificationType } from "@prisma/client";
import { hash } from "bcryptjs";
import { subDays, addDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.inboxItem.deleteMany(),
    prisma.postAnalytic.deleteMany(),
    prisma.platformAnalytic.deleteMany(),
    prisma.post.deleteMany(),
    prisma.campaignContact.deleteMany(),
    prisma.campaignDeal.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.deal.deleteMany(),
    prisma.note.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.socialAccount.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.user.deleteMany()
  ]);

  const passwordHash = await hash("Demo1234!", 12);
  const admin = await prisma.user.create({ data: { email: "admin@demo.com", name: "Demo Admin", role: Role.ADMIN, passwordHash, teamMemberships: { create: { role: Role.ADMIN } } } });
  const members = await Promise.all([
    prisma.user.create({ data: { email: "alex@demo.com", name: "Alex Morgan", role: Role.MEMBER, passwordHash, teamMemberships: { create: { role: Role.MEMBER } } } }),
    prisma.user.create({ data: { email: "maya@demo.com", name: "Maya Patel", role: Role.MANAGER, passwordHash, teamMemberships: { create: { role: Role.MANAGER } } } })
  ]);
  const users = [admin, ...members];

  const tags = await Promise.all(["Enterprise", "Creator", "Agency", "Hot"].map((name, i) => prisma.tag.create({ data: { name, color: ["#2563eb", "#14b8a6", "#f59e0b", "#dc2626"][i] } })));
  const contacts = [];
  for (let i = 0; i < 50; i += 1) {
    contacts.push(
      await prisma.contact.create({
        data: {
          firstName: `Contact${i + 1}`,
          lastName: "Demo",
          email: `contact${i + 1}@example.com`,
          company: `Company ${Math.ceil((i + 1) / 3)}`,
          jobTitle: "Marketing Lead",
          status: Object.values(ContactStatus)[i % Object.values(ContactStatus).length],
          source: i % 2 ? "LinkedIn" : "Website",
          createdById: admin.id,
          assignedToId: users[i % users.length].id,
          createdAt: subDays(new Date(), i % 90),
          tags: { connect: [{ id: tags[i % tags.length].id }] }
        }
      })
    );
  }

  const campaigns = [];
  for (let i = 0; i < 10; i += 1) {
    campaigns.push(
      await prisma.campaign.create({
        data: {
          name: `Campaign ${i + 1}`,
          description: "Demo omnichannel campaign",
          status: Object.values(CampaignStatus)[i % Object.values(CampaignStatus).length],
          startDate: subDays(new Date(), 60 - i),
          endDate: addDays(new Date(), i + 7)
        }
      })
    );
  }

  const deals = [];
  for (let i = 0; i < 20; i += 1) {
    deals.push(
      await prisma.deal.create({
        data: {
          title: `Opportunity ${i + 1}`,
          value: 5000 + i * 1750,
          stage: Object.values(DealStage)[i % Object.values(DealStage).length],
          probability: (i % 5) * 20,
          contactId: contacts[i % contacts.length].id,
          assignedToId: users[i % users.length].id,
          closeDate: addDays(new Date(), i * 3),
          campaigns: { create: { campaignId: campaigns[i % campaigns.length].id } }
        }
      })
    );
  }

  const accounts = await Promise.all(
    Object.values(Platform).map((platform, i) =>
      prisma.socialAccount.create({
        data: {
          platform,
          accountName: `${platform} Demo`,
          accountId: `demo-${platform}`,
          accessToken: "mock-token",
          userId: admin.id,
          followerCount: 1000 + i * 700,
          analytics: { create: Array.from({ length: 6 }, (_, d) => ({ followers: 1000 + d * 25 + i * 100, reach: 500 + d * 40, impressions: 900 + d * 60, engagementRate: 4 + i })) }
        }
      })
    )
  );

  const posts = [];
  for (let i = 0; i < 30; i += 1) {
    posts.push(
      await prisma.post.create({
        data: {
          body: `Demo social post ${i + 1} with campaign context and platform-specific copy.`,
          platform: Object.values(Platform)[i % Object.values(Platform).length],
          status: Object.values(PostStatus)[i % 3],
          scheduledAt: addDays(new Date(), i - 12),
          publishedAt: i % 3 === 2 ? subDays(new Date(), i) : null,
          authorId: admin.id,
          socialAccountId: accounts[i % accounts.length].id,
          campaignId: campaigns[i % campaigns.length].id,
          analytics: { create: { likes: i * 3, comments: i, shares: Math.floor(i / 2), reach: 200 + i * 40, impressions: 350 + i * 55, clicks: i * 2 } }
        }
      })
    );
  }

  for (let i = 0; i < 100; i += 1) {
    await prisma.activity.create({ data: { type: Object.values(ActivityType)[i % Object.values(ActivityType).length], description: `Demo activity ${i + 1}`, userId: users[i % users.length].id, contactId: contacts[i % contacts.length].id, dealId: deals[i % deals.length].id, createdAt: subDays(new Date(), i % 90) } });
  }
  for (let i = 0; i < 20; i += 1) {
    await prisma.notification.create({ data: { userId: users[i % users.length].id, type: Object.values(NotificationType)[i % Object.values(NotificationType).length], title: `Notification ${i + 1}`, body: "Demo notification body", link: "/inbox", isRead: i % 3 === 0, createdAt: subDays(new Date(), i) } });
  }
  for (let i = 0; i < 20; i += 1) {
    await prisma.inboxItem.create({ data: { platform: Object.values(Platform)[i % Object.values(Platform).length], type: Object.values(InboxType)[i % Object.values(InboxType).length], externalId: `message-${i}`, senderName: `Sender ${i + 1}`, body: "Thanks for the update. Can you send more details?", socialAccountId: accounts[i % accounts.length].id, contactId: contacts[i % contacts.length].id, isRead: i % 2 === 0, receivedAt: subDays(new Date(), i) } });
  }

  process.stdout.write("Seed complete: admin@demo.com / Demo1234!\n");
}

main().finally(async () => prisma.$disconnect());
