import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PrismaClient,
  type ConfidenceLevel,
  type ConfidentialityLevel,
  type Gender,
  type ParentRole,
  type SourceType,
  type SpouseKind,
  type ValidationStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

type SeedPerson = {
  id: string;
  provisionalId: string;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  gender: Gender;
  sourceId?: string | null;
  sourceNo?: string | null;
  group?: string | null;
  relationFromSource?: string | null;
  validationStatus: ValidationStatus;
  confidenceLevel: ConfidenceLevel;
  confidentialityLevel: ConfidentialityLevel;
  isRoot?: boolean;
  occupation?: string | null;
  biography?: string | null;
  observation?: string | null;
  birthDateText?: string | null;
  birthPlace?: string | null;
  deathDateText?: string | null;
  deathPlace?: string | null;
};

type SeedFile = {
  sources: {
    id: string;
    title: string;
    type: SourceType;
    description?: string | null;
    confidentialityLevel: ConfidentialityLevel;
    confidenceLevel: ConfidenceLevel;
  }[];
  people: SeedPerson[];
  parentLinks: {
    parentId: string;
    childId: string;
    parentRole: ParentRole;
    notes?: string | null;
  }[];
  spouseLinks: {
    personIdA: string;
    personIdB: string;
    kind: SpouseKind;
    notes?: string | null;
  }[];
};

function orderedSpouseIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function main() {
  const dataPath = path.join(__dirname, "data", "premiere-genealogie.json");
  const data = JSON.parse(await readFile(dataPath, "utf8")) as SeedFile;

  const branch = await prisma.familyBranch.upsert({
    where: { slug: "lignee-de-lanfia" },
    update: {
      name: "Lignée de Lanfia",
      description:
        "Branche fondatrice suivie par la plateforme. Elle commence à Lanfia TOURÉ et s'étend à partir des transcriptions SRC-001 à SRC-003, sans fusionner les homonymes.",
      originPlace: "Sanankoro / Afrique de l'Ouest",
      confidentialityLevel: "C0",
    },
    create: {
      name: "Lignée de Lanfia",
      slug: "lignee-de-lanfia",
      description:
        "Branche fondatrice suivie par la plateforme. Elle commence à Lanfia TOURÉ et s'étend à partir des transcriptions SRC-001 à SRC-003, sans fusionner les homonymes.",
      originPlace: "Sanankoro / Afrique de l'Ouest",
      confidentialityLevel: "C0",
    },
  });

  const sourceByKey = new Map<string, string>();

  for (const source of data.sources) {
    const record = await prisma.source.upsert({
      where: { id: source.id },
      update: {
        title: source.title,
        type: source.type,
        description: source.description,
        confidentialityLevel: source.confidentialityLevel,
        confidenceLevel: source.confidenceLevel,
      },
      create: {
        id: source.id,
        title: source.title,
        type: source.type,
        description: source.description,
        confidentialityLevel: source.confidentialityLevel,
        confidenceLevel: source.confidenceLevel,
      },
    });
    sourceByKey.set(source.id.toUpperCase().replace("SRC-", "SRC-"), record.id);
    sourceByKey.set(source.id, record.id);
    sourceByKey.set(source.id.replace("src-", "SRC-").toUpperCase(), record.id);
  }

  sourceByKey.set("SRC-001", "src-001");
  sourceByKey.set("SRC-002", "src-002");
  sourceByKey.set("SRC-003", "src-003");

  const historicalSource = await prisma.source.upsert({
    where: { id: "source-historiographie-samory" },
    update: {},
    create: {
      id: "source-historiographie-samory",
      title: "Historiographie de l'Almamy Samory TOURÉ",
      type: "HISTORICAL_BOOK",
      description:
        "Sources historiques publiques relatives à Almamy Samory TOURÉ (vers 1830–1900), fondateur de l'État du Wassoulou.",
      confidentialityLevel: "C0",
      confidenceLevel: "HIGH",
    },
  });

  for (const person of data.people) {
    const biography = [
      person.biography,
      person.observation ? `Observation : ${person.observation}` : null,
    ]
      .filter(Boolean)
      .join(" ");

    await prisma.person.upsert({
      where: { id: person.id },
      update: {
        firstName: person.firstName,
        lastName: person.lastName,
        otherNames: person.otherNames ?? null,
        gender: person.gender,
        birthDateText: person.birthDateText ?? null,
        birthPlace: person.birthPlace ?? null,
        deathDateText: person.deathDateText ?? null,
        deathPlace: person.deathPlace ?? null,
        occupation: person.occupation ?? null,
        biography: biography || null,
        isRoot: Boolean(person.isRoot),
        familyBranchId: branch.id,
        confidentialityLevel: person.confidentialityLevel,
        validationStatus: person.validationStatus,
        confidenceLevel: person.confidenceLevel,
      },
      create: {
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        otherNames: person.otherNames ?? null,
        gender: person.gender,
        birthDateText: person.birthDateText ?? null,
        birthPlace: person.birthPlace ?? null,
        deathDateText: person.deathDateText ?? null,
        deathPlace: person.deathPlace ?? null,
        occupation: person.occupation ?? null,
        biography: biography || null,
        isRoot: Boolean(person.isRoot),
        familyBranchId: branch.id,
        confidentialityLevel: person.confidentialityLevel,
        validationStatus: person.validationStatus,
        confidenceLevel: person.confidenceLevel,
      },
    });

    const sourceId = person.sourceId ? sourceByKey.get(person.sourceId) : null;
    if (sourceId) {
      await prisma.personSource.upsert({
        where: { personId_sourceId: { personId: person.id, sourceId } },
        update: {
          notes: person.sourceNo
            ? `N° source ${person.sourceNo}. ${person.relationFromSource ?? ""}`.trim()
            : person.relationFromSource,
        },
        create: {
          personId: person.id,
          sourceId,
          notes: person.sourceNo
            ? `N° source ${person.sourceNo}. ${person.relationFromSource ?? ""}`.trim()
            : person.relationFromSource,
        },
      });
    }
  }

  await prisma.personSource.upsert({
    where: {
      personId_sourceId: {
        personId: "person-almamy-samory-toure",
        sourceId: historicalSource.id,
      },
    },
    update: {
      notes: "Fiche historique publique, en plus de la transcription SRC-001.",
    },
    create: {
      personId: "person-almamy-samory-toure",
      sourceId: historicalSource.id,
      notes: "Fiche historique publique, en plus de la transcription SRC-001.",
    },
  });

  for (const link of data.parentLinks) {
    await prisma.parentChild.upsert({
      where: {
        parentId_childId_parentRole: {
          parentId: link.parentId,
          childId: link.childId,
          parentRole: link.parentRole,
        },
      },
      update: { notes: link.notes ?? null },
      create: {
        parentId: link.parentId,
        childId: link.childId,
        parentRole: link.parentRole,
        kinshipKind: "BIOLOGICAL",
        notes: link.notes ?? null,
      },
    });
  }

  for (const link of data.spouseLinks) {
    const [personIdA, personIdB] = orderedSpouseIds(link.personIdA, link.personIdB);
    await prisma.spouseRelationship.upsert({
      where: { personIdA_personIdB: { personIdA, personIdB } },
      update: { kind: link.kind, notes: link.notes ?? null },
      create: {
        personIdA,
        personIdB,
        kind: link.kind,
        notes: link.notes ?? null,
      },
    });
  }

  const counts = {
    people: await prisma.person.count(),
    parentLinks: await prisma.parentChild.count(),
    spouses: await prisma.spouseRelationship.count(),
    sources: await prisma.source.count(),
  };

  console.log("Seed TOURÉ FAMILY HERITAGE terminé.", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
