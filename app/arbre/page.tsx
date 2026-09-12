import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { FamilyTreeCanvas } from "@/components/genealogy/family-tree";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { EmptyState } from "@/components/heritage/empty-state";
import { getActor } from "@/lib/auth";
import { getRootPerson, listVisiblePeopleForTree } from "@/lib/genealogy/queries";
import { buildDescendantTree, unattachedPeople } from "@/lib/genealogy/tree";
import { loadGenealogy } from "@/lib/genealogy/safe";
import { personDisplayName } from "@/lib/genealogy/format";

export const metadata: Metadata = {
  title: "Arbre familial",
};

export default async function PublicTreePage() {
  const actor = await getActor();
  const { value, unavailable } = await loadGenealogy(async () => {
    const [root, people] = await Promise.all([getRootPerson(actor), listVisiblePeopleForTree(actor)]);
    return { root, people };
  }, { root: null, people: [] });

  const tree = value.root ? buildDescendantTree(value.people, value.root.id) : null;
  const detached = unattachedPeople(value.people, value.root?.id ?? null);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="font-heading text-4xl">Arbre familial</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Vue descendante depuis Lanfia TOURÉ. Les fiches non rattachées restent visibles à part :
          aucun lien n&apos;est inventé.
        </p>
        <div className="mt-8 grid gap-6">
          {unavailable ? <DatabaseUnavailable /> : null}
          {tree ? (
            <FamilyTreeCanvas root={tree} selectedId={value.root?.id} personBasePath="/genealogie" />
          ) : !unavailable ? (
            <EmptyState title="Arbre encore vide" description="Ajoutez DATABASE_URL puis lancez le seed pour afficher Lanfia TOURÉ." />
          ) : null}
          {detached.length > 0 ? (
            <section>
              <h2 className="font-heading text-2xl">Personnes non rattachées à la racine</h2>
              <ul className="mt-3 grid gap-2 text-sm">
                {detached.map((person) => (
                  <li key={person.id}>
                    <Link href={`/genealogie/${person.id}`} className="hover:underline">
                      {personDisplayName(person)}
                    </Link>
                    <span className="text-muted-foreground"> — filiation à documenter</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
