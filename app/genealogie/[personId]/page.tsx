import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
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

export default async function PublicPersonPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;
  const actor = await getActor();
  const { value: person, unavailable } = await loadGenealogy(() => getPersonById(actor, personId), null);

  if (unavailable) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
          <DatabaseUnavailable />
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!person) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        <PersonProfile person={person} profileHref={(id) => `/genealogie/${id}`} />
      </main>
      <SiteFooter />
    </>
  );
}
