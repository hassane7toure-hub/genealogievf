import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PersonForm } from "@/components/genealogy/person-form";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { getActor } from "@/lib/auth";
import { canWriteGenealogy } from "@/lib/authorization";
import { listFamilyBranches, listVisiblePeople } from "@/lib/genealogy/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = {
  title: "Nouvelle personne",
};

export default async function NewPersonPage() {
  const actor = await getActor();
  if (!canWriteGenealogy(actor)) {
    redirect("/espace/personnes");
  }

  const { value, unavailable } = await loadGenealogy(async () => {
    const [branches, people] = await Promise.all([listFamilyBranches(actor), listVisiblePeople(actor)]);
    return { branches, people };
  }, { branches: [], people: [] });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-4xl">Ajouter une personne</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          La fiche est créée en brouillon. Un homonyme déclenche un avertissement avant confirmation.
        </p>
      </div>
      {unavailable ? <DatabaseUnavailable /> : <PersonForm branches={value.branches} people={value.people} />}
    </div>
  );
}
