import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const branch = await prisma.familyBranch.upsert({
    where: { slug: "lignee-de-lanfia" },
    update: {
      name: "Lignée de Lanfia",
      description:
        "Branche fondatrice suivie par la plateforme. Elle commence à Lanfia TOURÉ et s'étend progressivement au fil des validations familiales.",
      originPlace: "Afrique de l'Ouest",
      confidentialityLevel: "C0",
    },
    create: {
      name: "Lignée de Lanfia",
      slug: "lignee-de-lanfia",
      description:
        "Branche fondatrice suivie par la plateforme. Elle commence à Lanfia TOURÉ et s'étend progressivement au fil des validations familiales.",
      originPlace: "Afrique de l'Ouest",
      confidentialityLevel: "C0",
    },
  });

  const oralSource = await prisma.source.upsert({
    where: { id: "source-tradition-orale" },
    update: {},
    create: {
      id: "source-tradition-orale",
      title: "Tradition orale de la Grande Famille TOURÉ",
      type: "ORAL_TESTIMONY",
      description:
        "Mémoire transmise par les aînés. Elle oriente la recherche généalogique mais ne constitue pas, à elle seule, un fait historique établi.",
      confidentialityLevel: "C0",
      confidenceLevel: "MEDIUM",
    },
  });

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

  const lanfia = await prisma.person.upsert({
    where: { id: "person-lanfia-toure" },
    update: {
      familyBranchId: branch.id,
      isRoot: true,
      confidentialityLevel: "C0",
      validationStatus: "PUBLISHED",
    },
    create: {
      id: "person-lanfia-toure",
      firstName: "Lanfia",
      lastName: "TOURÉ",
      gender: "MALE",
      occupation: "Ancêtre fondateur de la lignée suivie",
      biography:
        "Lanfia TOURÉ est le point de départ officiel de la généalogie conservée par cette plateforme. Les générations suivantes seront ajoutées progressivement, avec sources, niveau de confiance et validation familiale. Aucun lien descendant n'est inventé : chaque rattachement devra reposer sur un témoignage, une archive ou une décision du comité de validation.",
      familyBranchId: branch.id,
      isRoot: true,
      confidentialityLevel: "C0",
      validationStatus: "PUBLISHED",
      confidenceLevel: "MEDIUM",
    },
  });

  const samory = await prisma.person.upsert({
    where: { id: "person-almamy-samory-toure" },
    update: {
      familyBranchId: branch.id,
      confidentialityLevel: "C0",
      validationStatus: "PUBLISHED",
    },
    create: {
      id: "person-almamy-samory-toure",
      firstName: "Samory",
      lastName: "TOURÉ",
      otherNames: "Almamy Samory TOURÉ",
      gender: "MALE",
      birthDateText: "vers 1830",
      birthPlace: "Manyambaladugu",
      deathDateText: "1900",
      deathPlace: "Ndjolé, Gabon",
      occupation: "Almamy, fondateur de l'État du Wassoulou",
      biography:
        "Almamy Samory TOURÉ est une figure historique documentée de la lignée TOURÉ. Il est enregistré ici comme personnalité publique de la Grande Famille, sans filiation artificielle vers Lanfia. Le chaînage généalogique exact reste à établir, sourcer et valider par le comité familial.",
      familyBranchId: branch.id,
      confidentialityLevel: "C0",
      validationStatus: "PUBLISHED",
      confidenceLevel: "HIGH",
    },
  });

  await prisma.personSource.upsert({
    where: { personId_sourceId: { personId: lanfia.id, sourceId: oralSource.id } },
    update: {},
    create: {
      personId: lanfia.id,
      sourceId: oralSource.id,
      notes: "Point de départ généalogique transmis par la mémoire familiale.",
    },
  });

  await prisma.personSource.upsert({
    where: { personId_sourceId: { personId: samory.id, sourceId: historicalSource.id } },
    update: {},
    create: {
      personId: samory.id,
      sourceId: historicalSource.id,
      notes: "Fiche historique publique. Lien de parenté avec Lanfia à documenter.",
    },
  });

  console.log("Seed TOURÉ FAMILY HERITAGE terminé : Lanfia TOURÉ est la racine.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
