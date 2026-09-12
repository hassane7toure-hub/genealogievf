import type { Metadata } from "next";
import Link from "next/link";
import { PersonCard } from "@/components/genealogy/person-card";
import { EmptyState } from "@/components/heritage/empty-state";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { Button } from "@/components/ui/button";
import { getActor } from "@/lib/auth";
import { canWriteGenealogy } from "@/lib/authorization";
import { listVisiblePeople } from "@/lib/genealogy/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = {
  title: "Personnes",
};

export default async function PeoplePage() {
  const actor = await getActor();
  const { value: people, unavailable } = await loadGenealogy(() => listVisiblePeople(actor), []);
  const canWrite = canWriteGenealogy(actor);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl">Personnes</h1>
          <p className="mt-2 text-muted-foreground">Fiches visibles selon votre autorisation.</p>
        </div>
        {canWrite ? (
          <Button asChild>
            <Link href="/espace/personnes/nouvelle">Ajouter une personne</Link>
          </Button>
        ) : null}
      </div>
      {unavailable ? <DatabaseUnavailable /> : null}
      {people.length === 0 && !unavailable ? (
        <EmptyState
          title="Aucune personne visible"
          description="Le seed initial crée Lanfia TOURÉ, racine de la généalogie."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} href={`/espace/personnes/${person.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
