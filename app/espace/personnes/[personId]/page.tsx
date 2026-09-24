import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PersonProfile } from "@/components/genealogy/person-profile";
import { SpouseForm } from "@/components/genealogy/spouse-form";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { getActor } from "@/lib/auth";
import { canWriteGenealogy } from "@/lib/authorization";
import { personDisplayName } from "@/lib/genealogy/format";
import { getPersonById, listVisiblePeople } from "@/lib/genealogy/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ personId: string }>;
}): Promise<Metadata> {
  const { personId } = await params;
  const actor = await getActor();
  const { value: person } = await loadGenealogy(() => getPersonById(actor, personId), null);
  return { title: person ? personDisplayName(person) : "Personne" };
}

export default async function FamilyPersonPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;
  const actor = await getActor();
  const { value, unavailable } = await loadGenealogy(async () => {
    const person = await getPersonById(actor, personId);
    if (!person) return { person: null, candidates: [] };
    const people = canWriteGenealogy(actor) ? await listVisiblePeople(actor) : [];
    const spouseIds = new Set(person.spouses.map((spouse) => spouse.id));
    return {
      person,
      candidates: people.filter((item) => item.id !== person.id && !spouseIds.has(item.id)),
    };
  }, { person: null, candidates: [] });

  if (unavailable) {
    return <DatabaseUnavailable />;
  }

  if (!value.person) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <PersonProfile person={value.person} profileHref={(id) => `/espace/personnes/${id}`} />
      {canWriteGenealogy(actor) ? (
        <SpouseForm
          personId={value.person.id}
          personName={personDisplayName(value.person)}
          people={value.candidates}
        />
      ) : null}
    </div>
  );
}
