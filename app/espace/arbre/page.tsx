import type { Metadata } from "next";
import Link from "next/link";
import { FamilyTreeCanvas } from "@/components/genealogy/family-tree";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { EmptyState } from "@/components/heritage/empty-state";
import { getActor } from "@/lib/auth";
import { getRootPerson, listVisiblePeopleForTree } from "@/lib/genealogy/queries";
import { buildDescendantTree, findPaternalApex, unattachedPeople } from "@/lib/genealogy/tree";
import { loadGenealogy } from "@/lib/genealogy/safe";
import { personDisplayName } from "@/lib/genealogy/format";

export const metadata: Metadata = {
  title: "Arbre",
};

export default async function FamilyTreePage() {
  const actor = await getActor();
  const { value, unavailable } = await loadGenealogy(async () => {
    const [root, people] = await Promise.all([getRootPerson(actor), listVisiblePeopleForTree(actor)]);
    return { root, people };
  }, { root: null, people: [] });

  const apexId = value.root ? findPaternalApex(value.people, value.root.id) : null;
  const tree = apexId ? buildDescendantTree(value.people, apexId, value.root?.id) : null;
  const detached = unattachedPeople(value.people, apexId);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-4xl">Arbre familial</h1>
        <p className="mt-2 text-muted-foreground">
          Descendance complète de Samory, groupée par épouse. Les unions des enfants ne sont pas
          dans les listes Sanankoro.
        </p>
      </div>
      {unavailable ? <DatabaseUnavailable /> : null}
      {tree ? (
        <FamilyTreeCanvas root={tree} selectedId={value.root?.id} personBasePath="/espace/personnes" />
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
