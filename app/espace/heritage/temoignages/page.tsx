import type { Metadata } from "next";
import { AccessDenied } from "@/components/family/access-denied";
import { SubmitHeritageButton, TestimonyForm } from "@/components/heritage/heritage-forms";
import { HeritageSubnav } from "@/components/heritage/heritage-subnav";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { EmptyState } from "@/components/heritage/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/lib/auth";
import { canAccessFamilyLife, canWriteGenealogy, confidentialityLabel } from "@/lib/authorization";
import { confidenceLabel, testimonyStageLabel, validationStatusLabel } from "@/lib/heritage/labels";
import { listTestimonies } from "@/lib/heritage/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";
import { listVisiblePeople } from "@/lib/genealogy/queries";

export const metadata: Metadata = { title: "Témoignages" };

export default async function TestimoniesPage() {
  const actor = await getActor();
  if (!canAccessFamilyLife(actor)) {
    return <AccessDenied title="Témoignages" description="Les témoignages oraux sont réservés aux membres reconnus de la Grande Famille (C1)." />;
  }

  const { value, unavailable } = await loadGenealogy(async () => {
    const [testimonies, people] = await Promise.all([listTestimonies(actor), listVisiblePeople(actor)]);
    return { testimonies, people };
  }, { testimonies: [], people: [] });

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Héritage</p>
        <h1 className="mt-2 font-heading text-3xl leading-tight sm:text-4xl">Témoignages oraux</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Un témoignage brut, transcrit ou relu n&apos;est pas une vérité historique. Seule une validation du comité, appuyée par un procès-verbal, peut le faire avancer.
        </p>
      </div>
      <HeritageSubnav />
      {unavailable ? <DatabaseUnavailable /> : null}
      {canWriteGenealogy(actor) ? (
        <TestimonyForm people={value.people.map((person) => ({ id: person.id, firstName: person.firstName, lastName: person.lastName }))} />
      ) : null}
      {!unavailable && value.testimonies.length === 0 ? (
        <EmptyState title="Aucun témoignage" description="Le recueil oral commence ici, avant toute validation." />
      ) : (
        <div className="grid gap-4">
          {value.testimonies.map((testimony) => (
            <Card key={testimony.id}>
              <CardHeader>
                <CardTitle>{testimony.title}</CardTitle>
                <CardDescription>
                  {testimony.speakerName} · {testimonyStageLabel(testimony.stage)} · {confidenceLabel(testimony.confidenceLevel)} · {validationStatusLabel(testimony.validationStatus)} · {confidentialityLabel(testimony.confidentialityLevel)}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                {testimony.summary ? <p className="whitespace-pre-wrap">{testimony.summary}</p> : null}
                {testimony.transcript ? <p className="whitespace-pre-wrap text-muted-foreground">{testimony.transcript}</p> : null}
                {testimony.media.map((medium) => (
                  <a key={medium.id} href={medium.url} className="break-all text-primary underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                    {medium.title}
                  </a>
                ))}
                {canWriteGenealogy(actor) && (testimony.validationStatus === "DRAFT" || testimony.validationStatus === "REJECTED") ? (
                  <SubmitHeritageButton target="TESTIMONY" targetId={testimony.id} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
