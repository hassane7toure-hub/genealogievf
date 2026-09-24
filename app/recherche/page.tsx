import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { PersonCard } from "@/components/genealogy/person-card";
import { SearchForm } from "@/components/genealogy/search-form";
import { EmptyState } from "@/components/heritage/empty-state";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { getActor } from "@/lib/auth";
import { listVisiblePeople } from "@/lib/genealogy/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = {
  title: "Recherche",
};

export default async function PublicSearchPage({
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
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Recherche</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          La recherche respecte la confidentialité : un document ou une fiche C3 n&apos;apparaît jamais dans un résultat C0.
        </p>
        <div className="mt-6 max-w-xl">
          <SearchForm action="/recherche" defaultQuery={query} />
        </div>
        <div className="mt-8 grid gap-4">
          {unavailable ? <DatabaseUnavailable /> : null}
          {query && people.length === 0 && !unavailable ? (
            <EmptyState title="Aucun résultat" description="Essayez un autre nom, une branche ou une ville." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((person) => (
                <PersonCard key={person.id} person={person} href={`/genealogie/${person.id}`} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
