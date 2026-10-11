import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { FamilyTreeCanvas } from "@/components/genealogy/family-tree";
import { TreePersonChoice } from "@/components/genealogy/tree-person-choice";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { EmptyState } from "@/components/heritage/empty-state";
import { getActor } from "@/lib/auth";
import { getRootPerson, listVisiblePeopleForTree } from "@/lib/genealogy/queries";
import { prepareVisibleTree } from "@/lib/genealogy/tree";
import { loadGenealogy } from "@/lib/genealogy/safe";
import { personDisplayName } from "@/lib/genealogy/format";

export const metadata: Metadata = {
  title: "Arbre familial",
};

export default async function PublicTreePage({
  searchParams,
}: {
  searchParams: Promise<{ personne?: string }>;
}) {
  const { personne } = await searchParams;
  const actor = await getActor();
  const { value, unavailable } = await loadGenealogy(async () => {
    const [root, people] = await Promise.all([getRootPerson(actor), listVisiblePeopleForTree(actor)]);
    return { root, people };
  }, { root: null, people: [] });

  const viewRequested = Boolean(personne);
  const { tree, detached, focusedId, unknown } = viewRequested
    ? prepareVisibleTree(value.people, value.root?.id, personne === "lignee" ? undefined : personne)
    : { tree: null, detached: [], focusedId: null, unknown: false };
  const focused = focusedId ? value.people.find((person) => person.id === focusedId) : null;
  const options = value.people
    .map((person) => ({ id: person.id, label: personDisplayName(person) }))
    .sort((left, right) => left.label.localeCompare(right.label, "fr"));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Arbre familial</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {focused
            ? `L'arbre commence à ${personDisplayName(focused)} et montre sa descendance.`
            : personne === "lignee"
              ? "Lignée publique complète, de la racine jusqu'aux descendants visibles."
              : "Choisissez une personne. L'arbre s'affiche à partir d'elle."}
        </p>
        <div className="mt-8 grid gap-6">
          <TreePersonChoice
            people={options}
            selectedId={personne === "lignee" ? "lignee" : focusedId ?? undefined}
            actionPath="/arbre"
          />
          {unavailable ? <DatabaseUnavailable /> : null}
          {tree ? (
            <FamilyTreeCanvas key={tree.id} root={tree} selectedId={focusedId ?? value.root?.id} personBasePath="/genealogie" />
          ) : !unavailable && !viewRequested ? (
            <EmptyState title="Aucune personne choisie" description="Sélectionnez une personne, puis affichez sa descendance." />
          ) : !unavailable && unknown ? (
            <EmptyState title="Personne inaccessible" description="Cette fiche n'est pas visible avec votre accès." />
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
