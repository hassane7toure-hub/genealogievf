"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { HeritageTarget, ValidationStatus } from "@prisma/client";
import { requireActor } from "@/lib/auth";
import { canManageCommittee, canWriteGenealogy } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";
import { requirePrisma } from "@/lib/db";
import { loadHeritageTarget } from "@/lib/heritage/queries";

export type HeritageFormState = { error?: string } | null;

const levels = z.enum(["C0", "C1", "C2", "C3"]);
const confidence = z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]);
const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || URL.canParse(value), "L'adresse doit être une URL complète.");

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

async function requireWriter() {
  const actor = await requireActor();
  if (!canWriteGenealogy(actor) || !actor.user) {
    return { error: "Seuls les membres reconnus peuvent déposer une pièce d'héritage." } as const;
  }
  return { actor } as const;
}

async function requireCommittee() {
  const actor = await requireActor();
  if (!canManageCommittee(actor) || !actor.user) {
    return { error: "Seul le comité de validation peut trancher." } as const;
  }
  return { actor } as const;
}

function revalidateHeritage() {
  revalidatePath("/espace/heritage");
  revalidatePath("/espace/heritage/temoignages");
  revalidatePath("/espace/heritage/documents");
  revalidatePath("/espace/heritage/validation");
  revalidatePath("/espace");
  revalidatePath("/histoire");
}

async function setTargetStatus(
  target: HeritageTarget,
  targetId: string,
  status: ValidationStatus,
) {
  const prisma = requirePrisma();
  if (target === "SOURCE") {
    await prisma.source.update({ where: { id: targetId }, data: { validationStatus: status } });
    return;
  }
  if (target === "TESTIMONY") {
    await prisma.oralTestimony.update({
      where: { id: targetId },
      data: {
        validationStatus: status,
        ...(status === "APPROVED" ? { stage: "VALIDATED" as const } : {}),
        ...(status === "PUBLISHED" ? { stage: "PUBLISHED" as const } : {}),
      },
    });
    return;
  }
  await prisma.historicalDocument.update({ where: { id: targetId }, data: { validationStatus: status } });
}

const sourceSchema = z.object({
  title: z.string().trim().min(2).max(180),
  type: z.enum([
    "ORAL_TESTIMONY",
    "FAMILY_ARCHIVE",
    "OFFICIAL_DOCUMENT",
    "HISTORICAL_BOOK",
    "ACADEMIC_PUBLICATION",
    "ADMINISTRATIVE_DOCUMENT",
    "PHOTOGRAPH",
    "FAMILY_WITNESS",
    "OTHER",
  ]),
  description: z.string().trim().max(4000).optional(),
  author: z.string().trim().max(160).optional(),
  url: optionalUrl,
  confidentialityLevel: levels,
  confidenceLevel: confidence,
  personId: z.string().optional(),
});

export async function createSourceAction(
  _previous: HeritageFormState,
  formData: FormData,
): Promise<HeritageFormState> {
  const gate = await requireWriter();
  if ("error" in gate && gate.error) return { error: gate.error };

  const parsed = sourceSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type") || "OTHER",
    description: optionalText(formData.get("description")),
    author: optionalText(formData.get("author")),
    url: optionalText(formData.get("url")) ?? "",
    confidentialityLevel: formData.get("confidentialityLevel") || "C1",
    confidenceLevel: formData.get("confidenceLevel") || "MEDIUM",
    personId: optionalText(formData.get("personId")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const prisma = requirePrisma();
  const source = await prisma.source.create({
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      description: parsed.data.description,
      author: parsed.data.author,
      url: parsed.data.url || null,
      confidentialityLevel: parsed.data.confidentialityLevel,
      confidenceLevel: parsed.data.confidenceLevel,
      validationStatus: "DRAFT",
    },
  });

  if (parsed.data.personId) {
    const person = await prisma.person.findUnique({ where: { id: parsed.data.personId } });
    if (person) {
      await prisma.personSource.create({
        data: { personId: person.id, sourceId: source.id },
      });
    }
  }

  await writeAuditLog({
    actorUserId: gate.actor.user!.id,
    action: "CREATE",
    entityType: "Source",
    entityId: source.id,
    newValue: { title: source.title, validationStatus: "DRAFT" },
  });
  revalidateHeritage();
  return null;
}

const testimonySchema = z.object({
  title: z.string().trim().min(2).max(180),
  speakerName: z.string().trim().min(2).max(160),
  location: z.string().trim().max(160).optional(),
  historicalPeriod: z.string().trim().max(80).optional(),
  summary: z.string().trim().max(4000).optional(),
  transcript: z.string().trim().max(20000).optional(),
  audioUrl: optionalUrl,
  videoUrl: optionalUrl,
  personId: z.string().optional(),
  stage: z.enum(["RAW", "TRANSCRIBED", "REVIEWED"]),
  confidentialityLevel: levels,
  confidenceLevel: confidence,
});

export async function createTestimonyAction(
  _previous: HeritageFormState,
  formData: FormData,
): Promise<HeritageFormState> {
  const gate = await requireWriter();
  if ("error" in gate && gate.error) return { error: gate.error };

  const parsed = testimonySchema.safeParse({
    title: formData.get("title"),
    speakerName: formData.get("speakerName"),
    location: optionalText(formData.get("location")),
    historicalPeriod: optionalText(formData.get("historicalPeriod")),
    summary: optionalText(formData.get("summary")),
    transcript: optionalText(formData.get("transcript")),
    audioUrl: optionalText(formData.get("audioUrl")) ?? "",
    videoUrl: optionalText(formData.get("videoUrl")) ?? "",
    personId: optionalText(formData.get("personId")),
    stage: formData.get("stage") || "RAW",
    confidentialityLevel: formData.get("confidentialityLevel") || "C1",
    confidenceLevel: formData.get("confidenceLevel") || "LOW",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const prisma = requirePrisma();
  const testimony = await prisma.oralTestimony.create({
    data: {
      title: parsed.data.title,
      speakerName: parsed.data.speakerName,
      location: parsed.data.location,
      historicalPeriod: parsed.data.historicalPeriod,
      summary: parsed.data.summary,
      transcript: parsed.data.transcript,
      audioUrl: parsed.data.audioUrl || null,
      videoUrl: parsed.data.videoUrl || null,
      stage: parsed.data.stage,
      confidentialityLevel: parsed.data.confidentialityLevel,
      confidenceLevel: parsed.data.confidenceLevel,
      validationStatus: "DRAFT",
      authorUserId: gate.actor.user!.id,
      personId: parsed.data.personId
        ? (await prisma.person.findUnique({ where: { id: parsed.data.personId } }))?.id
        : undefined,
    },
  });

  if (parsed.data.audioUrl) {
    await prisma.heritageMedia.create({
      data: {
        title: `${testimony.title} — audio`,
        kind: "AUDIO",
        url: parsed.data.audioUrl,
        confidentialityLevel: testimony.confidentialityLevel,
        testimonyId: testimony.id,
      },
    });
  }
  if (parsed.data.videoUrl) {
    await prisma.heritageMedia.create({
      data: {
        title: `${testimony.title} — vidéo`,
        kind: "VIDEO",
        url: parsed.data.videoUrl,
        confidentialityLevel: testimony.confidentialityLevel,
        testimonyId: testimony.id,
      },
    });
  }

  await writeAuditLog({
    actorUserId: gate.actor.user!.id,
    action: "CREATE",
    entityType: "OralTestimony",
    entityId: testimony.id,
    newValue: { title: testimony.title, stage: testimony.stage },
  });
  revalidateHeritage();
  return null;
}

const documentSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(4000).optional(),
  dateText: z.string().trim().max(80).optional(),
  authorName: z.string().trim().max(160).optional(),
  archiveLocation: z.string().trim().max(180).optional(),
  historicalPeriod: z.string().trim().max(80).optional(),
  fileUrl: optionalUrl,
  personId: z.string().optional(),
  kind: z.enum([
    "HISTORICAL",
    "FAMILY_RECORD",
    "PHOTO",
    "MANUSCRIPT",
    "ADMINISTRATIVE",
    "GENEALOGICAL",
    "BOOK",
    "LETTER",
    "MAP",
    "OTHER",
  ]),
  confidentialityLevel: levels,
  confidenceLevel: confidence,
});

export async function createDocumentAction(
  _previous: HeritageFormState,
  formData: FormData,
): Promise<HeritageFormState> {
  const gate = await requireWriter();
  if ("error" in gate && gate.error) return { error: gate.error };

  const parsed = documentSchema.safeParse({
    title: formData.get("title"),
    description: optionalText(formData.get("description")),
    dateText: optionalText(formData.get("dateText")),
    authorName: optionalText(formData.get("authorName")),
    archiveLocation: optionalText(formData.get("archiveLocation")),
    historicalPeriod: optionalText(formData.get("historicalPeriod")),
    fileUrl: optionalText(formData.get("fileUrl")) ?? "",
    personId: optionalText(formData.get("personId")),
    kind: formData.get("kind") || "OTHER",
    confidentialityLevel: formData.get("confidentialityLevel") || "C1",
    confidenceLevel: formData.get("confidenceLevel") || "MEDIUM",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const prisma = requirePrisma();
  const document = await prisma.historicalDocument.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      dateText: parsed.data.dateText,
      authorName: parsed.data.authorName,
      archiveLocation: parsed.data.archiveLocation,
      historicalPeriod: parsed.data.historicalPeriod,
      fileUrl: parsed.data.fileUrl || null,
      kind: parsed.data.kind,
      confidentialityLevel: parsed.data.confidentialityLevel,
      confidenceLevel: parsed.data.confidenceLevel,
      validationStatus: "DRAFT",
      authorUserId: gate.actor.user!.id,
      personId: parsed.data.personId
        ? (await prisma.person.findUnique({ where: { id: parsed.data.personId } }))?.id
        : undefined,
    },
  });

  if (parsed.data.fileUrl) {
    await prisma.heritageMedia.create({
      data: {
        title: document.title,
        kind: parsed.data.kind === "PHOTO" ? "PHOTO" : "DOCUMENT",
        url: parsed.data.fileUrl,
        confidentialityLevel: document.confidentialityLevel,
        documentId: document.id,
      },
    });
  }

  await writeAuditLog({
    actorUserId: gate.actor.user!.id,
    action: "CREATE",
    entityType: "HistoricalDocument",
    entityId: document.id,
    newValue: { title: document.title, kind: document.kind },
  });
  revalidateHeritage();
  return null;
}

const targetSchema = z.object({
  target: z.enum(["SOURCE", "TESTIMONY", "DOCUMENT"]),
  targetId: z.string().min(1),
});

export async function submitHeritageAction(formData: FormData) {
  const gate = await requireWriter();
  if ("error" in gate && gate.error) return;

  const parsed = targetSchema.safeParse({
    target: formData.get("target"),
    targetId: formData.get("targetId"),
  });
  if (!parsed.success) return;

  const item = await loadHeritageTarget(gate.actor, parsed.data.target, parsed.data.targetId);
  if (!item || item.validationStatus === "APPROVED" || item.validationStatus === "PUBLISHED") return;
  if (item.validationStatus === "SUBMITTED" || item.validationStatus === "UNDER_REVIEW") return;

  const prisma = requirePrisma();
  const request = await prisma.validationRequest.create({
    data: {
      target: parsed.data.target,
      targetId: parsed.data.targetId,
      status: "SUBMITTED",
      submittedByUserId: gate.actor.user!.id,
    },
  });
  await setTargetStatus(parsed.data.target, parsed.data.targetId, "SUBMITTED");
  await writeAuditLog({
    actorUserId: gate.actor.user!.id,
    action: "SUBMIT",
    entityType: "ValidationRequest",
    entityId: request.id,
    newValue: { target: parsed.data.target, targetId: parsed.data.targetId },
  });
  await prisma.notification.create({
    data: {
      title: "Pièce soumise au comité",
      body: item.title,
      href: "/espace/heritage/validation",
    },
  });
  revalidateHeritage();
}

const reportSchema = z.object({
  title: z.string().trim().min(2).max(180),
  meetingDate: z.string().min(1),
  membersText: z.string().trim().min(2).max(2000),
  decision: z.string().trim().min(2).max(4000),
  signatureNote: z.string().trim().max(1000).optional(),
  fileUrl: optionalUrl,
  published: z.boolean(),
});

export async function createMeetingReportAction(
  _previous: HeritageFormState,
  formData: FormData,
): Promise<HeritageFormState> {
  const gate = await requireCommittee();
  if ("error" in gate && gate.error) return { error: gate.error };

  const parsed = reportSchema.safeParse({
    title: formData.get("title"),
    meetingDate: formData.get("meetingDate"),
    membersText: formData.get("membersText"),
    decision: formData.get("decision"),
    signatureNote: optionalText(formData.get("signatureNote")),
    fileUrl: optionalText(formData.get("fileUrl")) ?? "",
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const meetingDate = new Date(parsed.data.meetingDate);
  if (Number.isNaN(meetingDate.getTime())) return { error: "La date du procès-verbal est invalide." };

  const prisma = requirePrisma();
  const report = await prisma.meetingReport.create({
    data: {
      title: parsed.data.title,
      meetingDate,
      membersText: parsed.data.membersText,
      decision: parsed.data.decision,
      signatureNote: parsed.data.signatureNote,
      fileUrl: parsed.data.fileUrl || null,
      published: parsed.data.published,
      confidentialityLevel: parsed.data.published ? "C0" : "C1",
      authorUserId: gate.actor.user!.id,
    },
  });
  await writeAuditLog({
    actorUserId: gate.actor.user!.id,
    action: "CREATE",
    entityType: "MeetingReport",
    entityId: report.id,
    newValue: { title: report.title, published: report.published },
  });
  revalidateHeritage();
  return null;
}

const decisionSchema = z.object({
  requestId: z.string().min(1),
  kind: z.enum(["APPROVED", "REJECTED", "REVISION"]),
  notes: z.string().trim().max(4000).optional(),
  meetingReportId: z.string().optional(),
});

export async function decideValidationAction(
  _previous: HeritageFormState,
  formData: FormData,
): Promise<HeritageFormState> {
  const gate = await requireCommittee();
  if ("error" in gate && gate.error) return { error: gate.error };

  const parsed = decisionSchema.safeParse({
    requestId: formData.get("requestId"),
    kind: formData.get("kind"),
    notes: optionalText(formData.get("notes")),
    meetingReportId: optionalText(formData.get("meetingReportId")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  if (parsed.data.kind === "APPROVED" && !parsed.data.meetingReportId) {
    return { error: "Une approbation exige un procès-verbal signé." };
  }

  const prisma = requirePrisma();
  const request = await prisma.validationRequest.findUnique({ where: { id: parsed.data.requestId } });
  if (!request) return { error: "Cette demande n'existe pas." };
  const item = await loadHeritageTarget(gate.actor, request.target, request.targetId);
  if (!item) return { error: "La pièce n'est pas visible pour votre niveau d'accès." };

  if (parsed.data.kind === "APPROVED") {
    const report = await prisma.meetingReport.findUnique({ where: { id: parsed.data.meetingReportId } });
    if (!report) return { error: "Le procès-verbal est introuvable." };
  }

  const nextStatus: ValidationStatus =
    parsed.data.kind === "APPROVED" ? "APPROVED" : parsed.data.kind === "REJECTED" ? "REJECTED" : "DRAFT";

  await prisma.validationDecision.create({
    data: {
      requestId: request.id,
      kind: parsed.data.kind,
      notes: parsed.data.notes,
      meetingReportId: parsed.data.kind === "APPROVED" ? parsed.data.meetingReportId : null,
      decidedByUserId: gate.actor.user!.id,
    },
  });
  await prisma.validationRequest.update({
    where: { id: request.id },
    data: { status: nextStatus },
  });
  await setTargetStatus(request.target, request.targetId, nextStatus);
  if (parsed.data.notes) {
    await prisma.validationComment.create({
      data: {
        requestId: request.id,
        authorUserId: gate.actor.user!.id,
        body: parsed.data.notes,
      },
    });
  }
  await writeAuditLog({
    actorUserId: gate.actor.user!.id,
    action: parsed.data.kind,
    entityType: "ValidationRequest",
    entityId: request.id,
    newValue: { status: nextStatus, meetingReportId: parsed.data.meetingReportId ?? null },
  });
  revalidateHeritage();
  return null;
}

export async function publishHeritageAction(formData: FormData) {
  const gate = await requireCommittee();
  if ("error" in gate && gate.error) return;

  const parsed = targetSchema.safeParse({
    target: formData.get("target"),
    targetId: formData.get("targetId"),
  });
  if (!parsed.success) return;

  const item = await loadHeritageTarget(gate.actor, parsed.data.target, parsed.data.targetId);
  if (!item || item.validationStatus !== "APPROVED" || item.confidentialityLevel !== "C0") return;

  const prisma = requirePrisma();
  await setTargetStatus(parsed.data.target, parsed.data.targetId, "PUBLISHED");
  await prisma.validationRequest.updateMany({
    where: { target: parsed.data.target, targetId: parsed.data.targetId, status: "APPROVED" },
    data: { status: "PUBLISHED" },
  });
  await writeAuditLog({
    actorUserId: gate.actor.user!.id,
    action: "PUBLISH",
    entityType: parsed.data.target,
    entityId: parsed.data.targetId,
    newValue: { validationStatus: "PUBLISHED" },
  });
  revalidateHeritage();
}

export async function commentValidationAction(
  _previous: HeritageFormState,
  formData: FormData,
): Promise<HeritageFormState> {
  const gate = await requireCommittee();
  if ("error" in gate && gate.error) return { error: gate.error };
  const requestId = String(formData.get("requestId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!requestId || body.length < 2) return { error: "Le commentaire est trop court." };

  const prisma = requirePrisma();
  const request = await prisma.validationRequest.findUnique({ where: { id: requestId } });
  if (!request) return { error: "Cette demande n'existe pas." };
  const item = await loadHeritageTarget(gate.actor, request.target, request.targetId);
  if (!item) return { error: "La pièce n'est pas visible pour votre niveau d'accès." };

  if (request.status === "SUBMITTED") {
    await prisma.validationRequest.update({ where: { id: request.id }, data: { status: "UNDER_REVIEW" } });
    await setTargetStatus(request.target, request.targetId, "UNDER_REVIEW");
  }
  await prisma.validationComment.create({
    data: { requestId, authorUserId: gate.actor.user!.id, body },
  });
  revalidateHeritage();
  return null;
}
