import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PersonForm } from "@/components/genealogy/person-form";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { getActor } from "@/lib/auth";
import { canWriteGenealogy } from "@/lib/authorization";
import { personDisplayName } from "@/lib/genealogy/format";
import { getPersonById, listFamilyBranches, listVisiblePeople } from "@/lib/genealogy/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = {
  title: "Nouvelle personne",
};

export default async function NewPersonPage({
  searchParams,
}: {
  searchParams: Promise<{ conjointDe?: string }>;
}) {
  const actor = await getActor();
  if (!canWriteGenealogy(actor)) {
    redirect("/espace/personnes");
  }

  const { conjointDe } = await searchParams;
  const { value, unavailable } = await loadGenealogy(async () => {
    const [branches, people, spouseOf] = await Promise.all([
      listFamilyBranches(actor),
      listVisiblePeople(actor),
      conjointDe ? getPersonById(actor, conjointDe) : Promise.resolve(null),
    ]);
    return { branches, people, spouseOf };
  }, { branches: [], people: [], spouseOf: null });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
          {value.spouseOf ? "Ajouter un conjoint" : "Ajouter une personne"}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {value.spouseOf
            ? `La nouvelle fiche sera liée à ${personDisplayName(value.spouseOf)}. Conservez l'orthographe de la source.`
            : "La fiche est créée en brouillon. Un homonyme déclenche un avertissement avant confirmation."}
        </p>
      </div>
      {unavailable ? (
        <DatabaseUnavailable />
      ) : (
        <PersonForm
          branches={value.branches}
          people={value.people}
          spouseOf={
            value.spouseOf
              ? { id: value.spouseOf.id, name: personDisplayName(value.spouseOf) }
              : undefined
          }
        />
      )}
    </div>
  );
}
