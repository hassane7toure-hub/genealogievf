"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ConfidentialityLevel, ConfidenceLevel, Gender, Prisma, SpouseKind } from "@prisma/client";
import { requireActor } from "@/lib/auth";
import { canAccessLevel, canWriteGenealogy } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";
import { requirePrisma } from "@/lib/db";
import { findHomonyms } from "@/lib/genealogy/queries";
import { personDisplayName } from "@/lib/genealogy/format";

export type PersonFormState = {
  error?: string;
  values?: Record<string, string>;
  homonyms?: { id: string; name: string; cityOfResidence: string | null }[];
} | null;

const personSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est obligatoire.").max(80),
  lastName: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  otherNames: z.string().trim().max(120).optional(),
  gender: z.enum(["FEMALE", "MALE", "UNKNOWN"]),
  birthDateText: z.string().trim().max(80).optional(),
  birthPlace: z.string().trim().max(120).optional(),
  deathDateText: z.string().trim().max(80).optional(),
  deathPlace: z.string().trim().max(120).optional(),
  occupation: z.string().trim().max(120).optional(),
  cityOfResidence: z.string().trim().max(120).optional(),
  biography: z.string().trim().max(8000).optional(),
  familyBranchId: z.string().optional(),
  confidentialityLevel: z.enum(["C0", "C1", "C2", "C3"]),
  confidenceLevel: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
  spouseOf: z.string().optional(),
  confirmHomonyms: z.string().optional(),
});

function emptyToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function createPersonAction(
  _previous: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const actor = await requireActor();
  if (!canWriteGenealogy(actor) || !actor.user) {
    return { error: "Vous n'avez pas l'autorisation d'ajouter une personne." };
  }

  const parsed = personSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    otherNames: emptyToUndefined(String(formData.get("otherNames") ?? "")),
    gender: formData.get("gender") || "UNKNOWN",
    birthDateText: emptyToUndefined(String(formData.get("birthDateText") ?? "")),
    birthPlace: emptyToUndefined(String(formData.get("birthPlace") ?? "")),
    deathDateText: emptyToUndefined(String(formData.get("deathDateText") ?? "")),
    deathPlace: emptyToUndefined(String(formData.get("deathPlace") ?? "")),
    occupation: emptyToUndefined(String(formData.get("occupation") ?? "")),
    cityOfResidence: emptyToUndefined(String(formData.get("cityOfResidence") ?? "")),
    biography: emptyToUndefined(String(formData.get("biography") ?? "")),
    familyBranchId: emptyToUndefined(String(formData.get("familyBranchId") ?? "")),
    confidentialityLevel: formData.get("confidentialityLevel") || "C1",
    confidenceLevel: formData.get("confidenceLevel") || "MEDIUM",
    fatherId: emptyToUndefined(String(formData.get("fatherId") ?? "")),
    motherId: emptyToUndefined(String(formData.get("motherId") ?? "")),
    spouseOf: emptyToUndefined(String(formData.get("spouseOf") ?? "")),
    confirmHomonyms: emptyToUndefined(String(formData.get("confirmHomonyms") ?? "")),
  });

  const submittedValues = Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)]),
  );

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
      values: submittedValues,
    };
  }

  const data = parsed.data;
  const confidentialityLevel = data.confidentialityLevel as ConfidentialityLevel;

  if (!canAccessLevel(actor, confidentialityLevel)) {
    return {
      error: "Vous ne pouvez pas créer une fiche à ce niveau de confidentialité.",
      values: submittedValues,
    };
  }

  const homonyms = await findHomonyms({
    firstName: data.firstName,
    lastName: data.lastName,
  });

  if (homonyms.length > 0 && data.confirmHomonyms !== "1") {
    return {
      values: submittedValues,
      homonyms: homonyms.map((person) => ({
        id: person.id,
        name: personDisplayName(person),
        cityOfResidence: person.cityOfResidence,
      })),
    };
  }

  const prisma = requirePrisma();
  if (data.spouseOf) {
    const spouse = await prisma.person.findUnique({ where: { id: data.spouseOf } });
    if (!spouse) {
      return { error: "Le conjoint à lier est introuvable.", values: submittedValues };
    }
  }

  const created = await prisma.person.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      otherNames: data.otherNames,
      gender: data.gender as Gender,
      birthDateText: data.birthDateText,
      birthPlace: data.birthPlace,
      deathDateText: data.deathDateText,
      deathPlace: data.deathPlace,
      occupation: data.occupation,
      cityOfResidence: data.cityOfResidence,
      biography: data.biography,
      familyBranchId: data.familyBranchId,
      confidentialityLevel,
      confidenceLevel: data.confidenceLevel as ConfidenceLevel,
      validationStatus: "DRAFT",
    },
  });

  const parentLinks: Prisma.ParentChildCreateManyInput[] = [];
  if (data.fatherId) {
    parentLinks.push({ parentId: data.fatherId, childId: created.id, parentRole: "FATHER" });
  }
  if (data.motherId) {
    parentLinks.push({ parentId: data.motherId, childId: created.id, parentRole: "MOTHER" });
  }
  if (parentLinks.length > 0) {
    await prisma.parentChild.createMany({ data: parentLinks });
  }

  if (data.spouseOf) {
    const linked = await linkSpouses(prisma, created.id, data.spouseOf);
    if ("error" in linked) {
      return { error: linked.error, values: submittedValues };
    }
  }

  await writeAuditLog({
    actorUserId: actor.user.id,
    action: "PERSON_CREATED",
    entityType: "Person",
    entityId: created.id,
    newValue: {
      firstName: created.firstName,
      lastName: created.lastName,
      confidentialityLevel: created.confidentialityLevel,
    },
  });

  redirect(`/espace/personnes/${created.id}`);
}

export type SpouseFormState = { error?: string } | null;

function orderedSpouseIds(leftId: string, rightId: string) {
  return leftId < rightId
    ? { personIdA: leftId, personIdB: rightId }
    : { personIdA: rightId, personIdB: leftId };
}

async function linkSpouses(
  prisma: ReturnType<typeof requirePrisma>,
  leftId: string,
  rightId: string,
  extra?: { kind?: SpouseKind; startDate?: Date; place?: string; notes?: string },
) {
  if (leftId === rightId) {
    return { error: "Une personne ne peut pas être son propre conjoint." };
  }

  const [left, right] = await prisma.person.findMany({
    where: { id: { in: [leftId, rightId] } },
    select: { id: true },
  });
  if (!left || !right) {
    return { error: "L'une des deux fiches est introuvable." };
  }

  const pair = orderedSpouseIds(leftId, rightId);
  const existing = await prisma.spouseRelationship.findUnique({
    where: { personIdA_personIdB: { personIdA: pair.personIdA, personIdB: pair.personIdB } },
  });
  if (existing) {
    return { error: "Ce lien conjugal est déjà enregistré." };
  }

  await prisma.spouseRelationship.create({
    data: {
      ...pair,
      kind: extra?.kind ?? "MARRIAGE",
      startDate: extra?.startDate,
      place: extra?.place,
      notes: extra?.notes,
    },
  });

  revalidatePath(`/espace/personnes/${leftId}`);
  revalidatePath(`/espace/personnes/${rightId}`);
  revalidatePath("/espace/arbre");
  revalidatePath("/arbre");
  return { ok: true as const };
}

const spouseSchema = z.object({
  personId: z.string().min(1),
  spouseId: z.string().min(1, "Choisissez un conjoint."),
  kind: z.enum(["MARRIAGE", "UNION", "OTHER"]),
  startDate: z.string().optional(),
  place: z.string().trim().max(160).optional(),
});

export async function createSpouseAction(
  _previous: SpouseFormState,
  formData: FormData,
): Promise<SpouseFormState> {
  const actor = await requireActor();
  if (!canWriteGenealogy(actor) || !actor.user) {
    return { error: "Vous n'avez pas l'autorisation d'ajouter un conjoint." };
  }

  const parsed = spouseSchema.safeParse({
    personId: formData.get("personId"),
    spouseId: formData.get("spouseId"),
    kind: formData.get("kind") || "MARRIAGE",
    startDate: emptyToUndefined(String(formData.get("startDate") ?? "")),
    place: emptyToUndefined(String(formData.get("place") ?? "")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  let startDate: Date | undefined;
  if (parsed.data.startDate) {
    startDate = new Date(parsed.data.startDate);
    if (Number.isNaN(startDate.getTime())) {
      return { error: "La date de mariage est invalide." };
    }
  }

  const prisma = requirePrisma();
  const linked = await linkSpouses(prisma, parsed.data.personId, parsed.data.spouseId, {
    kind: parsed.data.kind,
    startDate,
    place: parsed.data.place,
  });
  if ("error" in linked) {
    return { error: linked.error };
  }

  await writeAuditLog({
    actorUserId: actor.user.id,
    action: "SPOUSE_LINKED",
    entityType: "SpouseRelationship",
    entityId: parsed.data.personId,
    newValue: {
      spouseId: parsed.data.spouseId,
      kind: parsed.data.kind,
    },
  });

  return null;
}
