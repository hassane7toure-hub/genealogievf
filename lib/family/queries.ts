import { canAccessLevel, canManageFinance, type Actor } from "@/lib/authorization";
import { requirePrisma } from "@/lib/db";

function visibleWhere(actor: Actor) {
  const allowed: Array<"C0" | "C1" | "C2" | "C3"> = ["C0"];
  if (canAccessLevel(actor, "C1")) allowed.push("C1");
  if (canAccessLevel(actor, "C2")) allowed.push("C2");
  if (canAccessLevel(actor, "C3")) allowed.push("C3");
  return { confidentialityLevel: { in: allowed } };
}

export async function listMeetings(actor: Actor) {
  const prisma = requirePrisma();
  return prisma.meeting.findMany({
    where: visibleWhere(actor),
    orderBy: { startsAt: "asc" },
  });
}

export async function listUpcomingMeetings(actor: Actor, take = 3) {
  const prisma = requirePrisma();
  return prisma.meeting.findMany({
    where: {
      ...visibleWhere(actor),
      status: "UPCOMING",
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    take,
  });
}

export async function listFamilyEvents(actor: Actor) {
  const prisma = requirePrisma();
  return prisma.familyEvent.findMany({
    where: visibleWhere(actor),
    orderBy: { startsAt: "asc" },
  });
}

export async function listDiscussions(actor: Actor) {
  const prisma = requirePrisma();
  return prisma.discussion.findMany({
    where: visibleWhere(actor),
    include: {
      author: true,
      _count: { select: { comments: true, votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDiscussion(actor: Actor, id: string) {
  const prisma = requirePrisma();
  const discussion = await prisma.discussion.findUnique({
    where: { id },
    include: {
      author: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      votes: { include: { voter: true } },
    },
  });

  if (!discussion || !canAccessLevel(actor, discussion.confidentialityLevel)) {
    return null;
  }

  return discussion;
}

export async function listContributions(actor: Actor) {
  if (!canManageFinance(actor)) return [];
  const prisma = requirePrisma();
  return prisma.contribution.findMany({
    where: visibleWhere(actor),
    orderBy: { paidAt: "desc" },
  });
}

export async function listExpenses(actor: Actor) {
  if (!canManageFinance(actor)) return [];
  const prisma = requirePrisma();
  return prisma.expense.findMany({
    where: visibleWhere(actor),
    orderBy: { spentAt: "desc" },
  });
}

export async function listNotifications(actor: Actor) {
  if (!actor.user) return [];
  const prisma = requirePrisma();
  return prisma.notification.findMany({
    where: {
      OR: [{ userId: actor.user.id }, { userId: null }],
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

export async function unreadNotificationCount(actor: Actor) {
  if (!actor.user) return 0;
  const prisma = requirePrisma();
  return prisma.notification.count({
    where: {
      readAt: null,
      OR: [{ userId: actor.user.id }, { userId: null }],
    },
  });
}
