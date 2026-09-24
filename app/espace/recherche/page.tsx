import type { Metadata } from "next";
import { PersonCard } from "@/components/genealogy/person-card";
import { SearchForm } from "@/components/genealogy/search-form";
import { EmptyState } from "@/components/heritage/empty-state";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { getActor } from "@/lib/auth";
import { listVisiblePeople } from "@/lib/genealogy/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = {
  title: "Recherche interne",
};

export default async function FamilySearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const actor = await getActor();
  const { value: people, unavailable } = await loadGenealogy(
    () => listVisiblePeople(actor, query || undefined),
    [],
  );

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Recherche interne</h1>
        <p className="mt-2 text-muted-foreground">Les résultats ne dépassent jamais votre niveau de confidentialité.</p>
      </div>
      <div className="max-w-xl">
        <SearchForm action="/espace/recherche" defaultQuery={query} />
      </div>
      {unavailable ? <DatabaseUnavailable /> : null}
      {query && people.length === 0 && !unavailable ? (
        <EmptyState title="Aucun résultat" description="Modifiez la requête ou vérifiez votre niveau d'accès." />
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
