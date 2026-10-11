import type { Metadata } from "next";
import { AccessDenied } from "@/components/family/access-denied";
import { SourceForm, SubmitHeritageButton } from "@/components/heritage/heritage-forms";
import { HeritageSubnav } from "@/components/heritage/heritage-subnav";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { EmptyState } from "@/components/heritage/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/lib/auth";
import { canAccessFamilyLife, canWriteGenealogy, confidentialityLabel } from "@/lib/authorization";
import { confidenceLabel, sourceTypeLabel, validationStatusLabel } from "@/lib/heritage/labels";
import { listSources } from "@/lib/heritage/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";
import { listVisiblePeople } from "@/lib/genealogy/queries";

export const metadata: Metadata = { title: "Sources" };

export default async function HeritageSourcesPage() {
  const actor = await getActor();
  if (!canAccessFamilyLife(actor)) {
    return <AccessDenied title="Héritage" description="Les sources sont réservées aux membres reconnus de la Grande Famille (C1)." />;
  }

  const { value, unavailable } = await loadGenealogy(async () => {
    const [sources, people] = await Promise.all([listSources(actor), listVisiblePeople(actor)]);
    return { sources, people };
  }, { sources: [], people: [] });

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Héritage</p>
        <h1 className="mt-2 font-heading text-3xl leading-tight sm:text-4xl">Sources</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Chaque information sensible reste un brouillon jusqu&apos;à l&apos;examen du comité. Le niveau de confiance indique la solidité de la source, pas une certitude.
        </p>
      </div>
      <HeritageSubnav />
      {unavailable ? <DatabaseUnavailable /> : null}
      {canWriteGenealogy(actor) ? (
        <SourceForm people={value.people.map((person) => ({ id: person.id, firstName: person.firstName, lastName: person.lastName }))} />
      ) : null}
      {!unavailable && value.sources.length === 0 ? (
        <EmptyState title="Aucune source" description="Déposez une archive, un livre ou un témoin avant de le soumettre." />
      ) : (
        <div className="grid gap-4">
          {value.sources.map((source) => (
            <Card key={source.id}>
              <CardHeader>
                <CardTitle>{source.title}</CardTitle>
                <CardDescription>
                  {sourceTypeLabel(source.type)} · {confidenceLabel(source.confidenceLevel)} · {validationStatusLabel(source.validationStatus)} · {confidentialityLabel(source.confidentialityLevel)}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                {source.author ? <p>Auteur : {source.author}</p> : null}
                {source.description ? <p className="whitespace-pre-wrap text-muted-foreground">{source.description}</p> : null}
                {source.url ? (
                  <a href={source.url} className="break-all text-primary underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                    {source.url}
                  </a>
                ) : null}
                {canWriteGenealogy(actor) && (source.validationStatus === "DRAFT" || source.validationStatus === "REJECTED") ? (
                  <SubmitHeritageButton target="SOURCE" targetId={source.id} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
