import type { Metadata } from "next";
import Link from "next/link";
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
  title: "Arbre",
};

export default async function FamilyTreePage({
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
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Arbre familial</h1>
        <p className="mt-2 text-muted-foreground">
          {focused
            ? `L'arbre commence à ${personDisplayName(focused)} et montre sa descendance.`
            : personne === "lignee"
              ? "Lignée complète, de la racine jusqu'aux descendants visibles."
              : "Choisissez une personne. L'arbre s'affiche à partir d'elle."}
        </p>
      </div>
      <TreePersonChoice
        people={options}
        selectedId={personne === "lignee" ? "lignee" : focusedId ?? undefined}
        actionPath="/espace/arbre"
      />
      {unavailable ? <DatabaseUnavailable /> : null}
      {tree ? (
        <FamilyTreeCanvas key={tree.id} root={tree} selectedId={focusedId ?? value.root?.id} personBasePath="/espace/personnes" />
      ) : !unavailable && !viewRequested ? (
        <EmptyState title="Aucune personne choisie" description="Sélectionnez une personne, puis affichez sa descendance." />
      ) : !unavailable && unknown ? (
        <EmptyState title="Personne inaccessible" description="Cette fiche n'est pas visible avec votre accès." />
      ) : !unavailable ? (
        <EmptyState title="Arbre encore vide" description="Lancez le seed pour placer Lanfia TOURÉ à la racine." />
      ) : null}
      {detached.length > 0 ? (
        <section>
          <h2 className="font-heading text-2xl">Non rattachés à la racine</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {detached.map((person) => (
              <li key={person.id}>
                <Link href={`/espace/personnes/${person.id}`} className="hover:underline">
                  {personDisplayName(person)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
