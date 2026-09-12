import type { ConfidentialityLevel, Person } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { canAccessLevel, type Actor } from "@/lib/authorization";

const personInclude = {
  familyBranch: true,
  sources: { include: { source: true } },
  parentLinks: { include: { child: true } },
  childLinks: { include: { parent: true } },
  spouseLinksAsA: { include: { personB: true } },
  spouseLinksAsB: { include: { personA: true } },
} as const;

export type PersonWithRelations = Awaited<ReturnType<typeof getPersonById>>;

function visibleWhere(actor: Actor) {
  const allowed: ConfidentialityLevel[] = ["C0"];
  if (canAccessLevel(actor, "C1")) allowed.push("C1");
  if (canAccessLevel(actor, "C2")) allowed.push("C2");
  if (canAccessLevel(actor, "C3")) allowed.push("C3");
  return { confidentialityLevel: { in: allowed } };
}

export async function listVisiblePeople(actor: Actor, query?: string) {
  const prisma = requirePrisma();
  const confidentiality = visibleWhere(actor);

  return prisma.person.findMany({
    where: {
      AND: [
        confidentiality,
        query
          ? {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { otherNames: { contains: query, mode: "insensitive" } },
                { cityOfResidence: { contains: query, mode: "insensitive" } },
                { familyBranch: { name: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {},
      ],
    },
    include: { familyBranch: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getPersonById(actor: Actor, id: string) {
  const prisma = requirePrisma();
  const person = await prisma.person.findUnique({
    where: { id },
    include: personInclude,
  });

  if (!person) {
    return null;
  }

  if (!canAccessLevel(actor, person.confidentialityLevel)) {
    return null;
  }

  const sources = person.sources.filter((item) => canAccessLevel(actor, item.source.confidentialityLevel));

  return {
    ...person,
    sources,
    parents: person.childLinks
      .filter((link) => canAccessLevel(actor, link.parent.confidentialityLevel))
      .map((link) => ({ ...link.parent, parentRole: link.parentRole, kinshipKind: link.kinshipKind })),
    children: person.parentLinks
      .filter((link) => canAccessLevel(actor, link.child.confidentialityLevel))
      .map((link) => ({ ...link.child, parentRole: link.parentRole })),
    spouses: [
      ...person.spouseLinksAsA
        .filter((link) => canAccessLevel(actor, link.personB.confidentialityLevel))
        .map((link) => link.personB),
      ...person.spouseLinksAsB
        .filter((link) => canAccessLevel(actor, link.personA.confidentialityLevel))
        .map((link) => link.personA),
    ],
  };
}

export async function getRootPerson(actor: Actor) {
  const prisma = requirePrisma();
  return prisma.person.findFirst({
    where: { isRoot: true, ...visibleWhere(actor) },
    include: { familyBranch: true },
  });
}

export async function listFamilyBranches(actor: Actor) {
  const prisma = requirePrisma();
  return prisma.familyBranch.findMany({
    where: visibleWhere(actor),
    orderBy: { name: "asc" },
  });
}

export async function findHomonyms(input: {
  firstName: string;
  lastName: string;
  excludeId?: string;
}): Promise<Person[]> {
  const prisma = requirePrisma();
  return prisma.person.findMany({
    where: {
      firstName: { equals: input.firstName, mode: "insensitive" },
      lastName: { equals: input.lastName, mode: "insensitive" },
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listVisiblePeopleForTree(actor: Actor) {
  const prisma = requirePrisma();
  return prisma.person.findMany({
    where: visibleWhere(actor),
    include: {
      familyBranch: true,
      parentLinks: true,
      childLinks: true,
      spouseLinksAsA: true,
      spouseLinksAsB: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}
