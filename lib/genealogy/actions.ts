"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import type { ConfidentialityLevel, ConfidenceLevel, Gender, Prisma } from "@prisma/client";
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
