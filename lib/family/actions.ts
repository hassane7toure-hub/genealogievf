"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type VoteChoice } from "@prisma/client";
import { requireActor } from "@/lib/auth";
import { canAccessFamilyLife, canManageFinance, canWriteFamilyLife } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";
import { requirePrisma } from "@/lib/db";

export type FamilyFormState = { error?: string } | null;

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function requireFamilyWriter() {
  return requireActor().then((actor) => {
    if (!canAccessFamilyLife(actor) || !canWriteFamilyLife(actor) || !actor.user) {
      return { error: "Vous n'avez pas l'autorisation d'écrire dans l'espace famille." } as const;
    }
    return { actor } as const;
  });
}

const meetingSchema = z.object({
  title: z.string().trim().min(2).max(160),
  startsAt: z.string().min(1),
  location: z.string().trim().max(160).optional(),
  agenda: z.string().trim().max(4000).optional(),
});

export async function createMeetingAction(
  _previous: FamilyFormState,
  formData: FormData,
): Promise<FamilyFormState> {
  const gate = await requireFamilyWriter();
  if ("error" in gate && gate.error) return { error: gate.error };

  const parsed = meetingSchema.safeParse({
    title: formData.get("title"),
    startsAt: formData.get("startsAt"),
    location: optionalText(formData.get("location")),
    agenda: optionalText(formData.get("agenda")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) return { error: "La date de réunion est invalide." };

  const prisma = requirePrisma();
  const meeting = await prisma.meeting.create({
    data: {
      title: parsed.data.title,
      startsAt,
      location: parsed.data.location,
      agenda: parsed.data.agenda,
      confidentialityLevel: "C1",
    },
  });

  await writeAuditLog({
    actorUserId: gate.actor.user!.id,
    action: "CREATE",
    entityType: "Meeting",
    entityId: meeting.id,
    newValue: { title: meeting.title, startsAt: meeting.startsAt.toISOString() },
  });
  await prisma.notification.create({
    data: {
      title: "Nouvelle réunion",
      body: meeting.title,
      href: "/espace/reunions",
    },
  });

  revalidatePath("/espace/reunions");
  revalidatePath("/espace");
  return null;
}

const eventSchema = z.object({
  title: z.string().trim().min(2).max(160),
  startsAt: z.string().min(1),
  location: z.string().trim().max(160).optional(),
  description: z.string().trim().max(4000).optional(),
  kind: z.enum(["FAMILY_MEETING", "WEDDING", "BAPTISM", "FUNERAL", "CULTURAL", "HERITAGE", "ANNIVERSARY", "OTHER"]),
});

export async function createEventAction(
  _previous: FamilyFormState,
  formData: FormData,
): Promise<FamilyFormState> {
  const gate = await requireFamilyWriter();
  if ("error" in gate && gate.error) return { error: gate.error };

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    startsAt: formData.get("startsAt"),
    location: optionalText(formData.get("location")),
    description: optionalText(formData.get("description")),
    kind: formData.get("kind") || "OTHER",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) return { error: "La date de l'événement est invalide." };

  const prisma = requirePrisma();
  const event = await prisma.familyEvent.create({
    data: {
      title: parsed.data.title,
      startsAt,
      location: parsed.data.location,
      description: parsed.data.description,
      kind: parsed.data.kind,
      confidentialityLevel: "C1",
    },
  });

  await writeAuditLog({
    actorUserId: gate.actor.user!.id,
    action: "CREATE",
    entityType: "FamilyEvent",
    entityId: event.id,
    newValue: { title: event.title },
  });
  await prisma.notification.create({
    data: { title: "Nouvel événement", body: event.title, href: "/espace/evenements" },
  });

  revalidatePath("/espace/evenements");
  revalidatePath("/espace");
  return null;
}

const discussionSchema = z.object({
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(4).max(8000),
});

export async function createDiscussionAction(
  _previous: FamilyFormState,
  formData: FormData,
): Promise<FamilyFormState> {
  const gate = await requireFamilyWriter();
  if ("error" in gate && gate.error) return { error: gate.error };

  const parsed = discussionSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const prisma = requirePrisma();
  const discussion = await prisma.discussion.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      authorUserId: gate.actor.user!.id,
      confidentialityLevel: "C1",
    },
  });

  await writeAuditLog({
    actorUserId: gate.actor.user!.id,
    action: "CREATE",
    entityType: "Discussion",
    entityId: discussion.id,
    newValue: { title: discussion.title },
  });
  await prisma.notification.create({
    data: { title: "Nouvelle discussion", body: discussion.title, href: `/espace/discussions/${discussion.id}` },
  });

  redirect(`/espace/discussions/${discussion.id}`);
}

export async function addCommentAction(
  _previous: FamilyFormState,
  formData: FormData,
): Promise<FamilyFormState> {
  const gate = await requireFamilyWriter();
  if ("error" in gate && gate.error) return { error: gate.error };

  const discussionId = String(formData.get("discussionId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!discussionId || body.length < 2) return { error: "Le commentaire est trop court." };

  const prisma = requirePrisma();
  const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
  if (!discussion || discussion.status !== "OPEN") {
    return { error: "Cette discussion n'accepte plus de commentaires." };
  }

  await prisma.discussionComment.create({
    data: { discussionId, body, authorUserId: gate.actor.user!.id },
  });
  revalidatePath(`/espace/discussions/${discussionId}`);
  return null;
}

export async function castVoteAction(discussionId: string, choice: VoteChoice) {
  const actor = await requireActor();
  if (!canAccessFamilyLife(actor) || !canWriteFamilyLife(actor) || !actor.user) {
    return;
  }

  const prisma = requirePrisma();
  const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
  if (!discussion || discussion.status !== "OPEN") return;

  await prisma.vote.upsert({
    where: { discussionId_voterUserId: { discussionId, voterUserId: actor.user.id } },
    update: { choice },
    create: { discussionId, voterUserId: actor.user.id, choice },
  });

  await writeAuditLog({
    actorUserId: actor.user.id,
    action: "VOTE",
    entityType: "Discussion",
    entityId: discussionId,
    newValue: { choice },
  });
  revalidatePath(`/espace/discussions/${discussionId}`);
}

const moneySchema = z.object({
  name: z.string().trim().min(2).max(160),
  amount: z.string().trim().min(1),
  date: z.string().min(1),
  detail: z.string().trim().max(400).optional(),
});

export async function createContributionAction(
  _previous: FamilyFormState,
  formData: FormData,
): Promise<FamilyFormState> {
  const actor = await requireActor();
  if (!canManageFinance(actor) || !actor.user) {
    return { error: "La caisse est réservée au comité restreint." };
  }

  const parsed = moneySchema.safeParse({
    name: formData.get("contributorName"),
    amount: formData.get("amount"),
    date: formData.get("paidAt"),
    detail: optionalText(formData.get("purpose")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const amount = Number(parsed.data.amount.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Le montant est invalide." };
  const paidAt = new Date(parsed.data.date);
  if (Number.isNaN(paidAt.getTime())) return { error: "La date est invalide." };

  const prisma = requirePrisma();
  const record = await prisma.contribution.create({
    data: {
      contributorName: parsed.data.name,
      amount: new Prisma.Decimal(amount),
      paidAt,
      purpose: parsed.data.detail,
      confidentialityLevel: "C3",
    },
  });
  await writeAuditLog({
    actorUserId: actor.user.id,
    action: "CREATE",
    entityType: "Contribution",
    entityId: record.id,
    newValue: { amount, contributorName: parsed.data.name },
  });
  revalidatePath("/espace/caisse");
  return null;
}

export async function createExpenseAction(
  _previous: FamilyFormState,
  formData: FormData,
): Promise<FamilyFormState> {
  const actor = await requireActor();
  if (!canManageFinance(actor) || !actor.user) {
    return { error: "La caisse est réservée au comité restreint." };
  }

  const parsed = moneySchema.safeParse({
    name: formData.get("title"),
    amount: formData.get("amount"),
    date: formData.get("spentAt"),
    detail: optionalText(formData.get("category")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const amount = Number(parsed.data.amount.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Le montant est invalide." };
  const spentAt = new Date(parsed.data.date);
  if (Number.isNaN(spentAt.getTime())) return { error: "La date est invalide." };

  const prisma = requirePrisma();
  const record = await prisma.expense.create({
    data: {
      title: parsed.data.name,
      amount: new Prisma.Decimal(amount),
      spentAt,
      category: parsed.data.detail,
      confidentialityLevel: "C3",
    },
  });
  await writeAuditLog({
    actorUserId: actor.user.id,
    action: "CREATE",
    entityType: "Expense",
    entityId: record.id,
    newValue: { amount, title: parsed.data.name },
  });
  revalidatePath("/espace/caisse");
  return null;
}

export async function markNotificationsReadAction() {
  const actor = await requireActor();
  if (!actor.user) return;
  const prisma = requirePrisma();
  await prisma.notification.updateMany({
    where: {
      readAt: null,
      OR: [{ userId: actor.user.id }, { userId: null }],
    },
    data: { readAt: new Date() },
  });
  revalidatePath("/espace/notifications");
  revalidatePath("/espace");
}
