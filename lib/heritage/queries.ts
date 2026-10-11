import type { HeritageTarget } from "@prisma/client";
import { canAccessLevel, type Actor } from "@/lib/authorization";
import { requirePrisma } from "@/lib/db";

function allowedLevels(actor: Actor) {
  const allowed: Array<"C0" | "C1" | "C2" | "C3"> = ["C0"];
  if (canAccessLevel(actor, "C1")) allowed.push("C1");
  if (canAccessLevel(actor, "C2")) allowed.push("C2");
  if (canAccessLevel(actor, "C3")) allowed.push("C3");
  return allowed;
}

function visibleWhere(actor: Actor) {
  return { confidentialityLevel: { in: allowedLevels(actor) } };
}

export async function listSources(actor: Actor) {
  const prisma = requirePrisma();
  return prisma.source.findMany({
    where: visibleWhere(actor),
    orderBy: { updatedAt: "desc" },
  });
}

export async function listTestimonies(actor: Actor) {
  const prisma = requirePrisma();
  return prisma.oralTestimony.findMany({
    where: visibleWhere(actor),
    include: { media: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listDocuments(actor: Actor) {
  const prisma = requirePrisma();
  return prisma.historicalDocument.findMany({
    where: visibleWhere(actor),
    include: { media: true, person: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listMeetingReports(actor: Actor) {
  const prisma = requirePrisma();
  return prisma.meetingReport.findMany({
    where: visibleWhere(actor),
    orderBy: { meetingDate: "desc" },
  });
}

export async function listValidationRequests(actor: Actor) {
  const prisma = requirePrisma();
  const requests = await prisma.validationRequest.findMany({
    include: {
      submittedBy: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      decisions: { include: { meetingReport: true, decidedBy: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const visible = [];
  for (const request of requests) {
    const target = await loadHeritageTarget(actor, request.target, request.targetId);
    if (target) visible.push({ ...request, targetTitle: target.title, targetLevel: target.confidentialityLevel });
  }
  return visible;
}

export async function countOpenValidations(actor: Actor) {
  const requests = await listValidationRequests(actor);
  return requests.filter((request) => request.status === "SUBMITTED" || request.status === "UNDER_REVIEW").length;
}

export async function listPublicHeritage() {
  const prisma = requirePrisma();
  const where = { confidentialityLevel: "C0" as const, validationStatus: "PUBLISHED" as const };
  const [testimonies, documents, sources] = await Promise.all([
    prisma.oralTestimony.findMany({ where, orderBy: { updatedAt: "desc" } }),
    prisma.historicalDocument.findMany({ where, orderBy: { updatedAt: "desc" } }),
    prisma.source.findMany({ where, orderBy: { updatedAt: "desc" } }),
  ]);
  const reports = await prisma.meetingReport.findMany({
    where: { confidentialityLevel: "C0", published: true },
    orderBy: { meetingDate: "desc" },
  });
  return { testimonies, documents, sources, reports };
}

export async function loadHeritageTarget(actor: Actor, target: HeritageTarget, targetId: string) {
  const prisma = requirePrisma();
  if (target === "SOURCE") {
    const item = await prisma.source.findUnique({ where: { id: targetId } });
    if (!item || !canAccessLevel(actor, item.confidentialityLevel)) return null;
    return item;
  }
  if (target === "TESTIMONY") {
    const item = await prisma.oralTestimony.findUnique({ where: { id: targetId } });
    if (!item || !canAccessLevel(actor, item.confidentialityLevel)) return null;
    return item;
  }
  const item = await prisma.historicalDocument.findUnique({ where: { id: targetId } });
  if (!item || !canAccessLevel(actor, item.confidentialityLevel)) return null;
  return item;
}
