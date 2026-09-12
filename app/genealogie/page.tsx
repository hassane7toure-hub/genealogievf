import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { PersonCard } from "@/components/genealogy/person-card";
import { EmptyState } from "@/components/heritage/empty-state";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { getActor } from "@/lib/auth";
import { listVisiblePeople } from "@/lib/genealogy/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = {
  title: "Généalogie",
};

export default async function GenealogyPage() {
  const actor = await getActor();
  const { value: people, unavailable } = await loadGenealogy(() => listVisiblePeople(actor), []);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="font-heading text-4xl">Généalogie publique</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Seules les fiches autorisées pour votre niveau de confidentialité sont listées. Un visiteur
          non connecté ne voit que le niveau C0.
        </p>
        <div className="mt-8 grid gap-4">
          {unavailable ? <DatabaseUnavailable /> : null}
          {people.length === 0 && !unavailable ? (
            <EmptyState
              title="Aucune fiche visible"
              description="La lignée commencera à s'afficher après le seed de Lanfia TOURÉ."
            />
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
