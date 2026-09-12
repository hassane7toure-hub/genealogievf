import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PersonProfile } from "@/components/genealogy/person-profile";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { getActor } from "@/lib/auth";
import { getPersonById } from "@/lib/genealogy/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";
import { personDisplayName } from "@/lib/genealogy/format";

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
  const { value: person, unavailable } = await loadGenealogy(() => getPersonById(actor, personId), null);

  if (unavailable) {
    return <DatabaseUnavailable />;
  }

  if (!person) {
    notFound();
  }

  return <PersonProfile person={person} profileHref={(id) => `/espace/personnes/${id}`} />;
}
