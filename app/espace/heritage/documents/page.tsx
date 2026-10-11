import type { Metadata } from "next";
import { AccessDenied } from "@/components/family/access-denied";
import { DocumentForm, SubmitHeritageButton } from "@/components/heritage/heritage-forms";
import { HeritageSubnav } from "@/components/heritage/heritage-subnav";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { EmptyState } from "@/components/heritage/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/lib/auth";
import { canAccessFamilyLife, canWriteGenealogy, confidentialityLabel } from "@/lib/authorization";
import { confidenceLabel, documentKindLabel, validationStatusLabel } from "@/lib/heritage/labels";
import { listDocuments } from "@/lib/heritage/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";
import { listVisiblePeople } from "@/lib/genealogy/queries";

export const metadata: Metadata = { title: "Documents historiques" };

export default async function DocumentsPage() {
  const actor = await getActor();
  if (!canAccessFamilyLife(actor)) {
    return <AccessDenied title="Documents" description="Les documents historiques sont réservés aux membres reconnus de la Grande Famille (C1)." />;
  }

  const { value, unavailable } = await loadGenealogy(async () => {
    const [documents, people] = await Promise.all([listDocuments(actor), listVisiblePeople(actor)]);
    return { documents, people };
  }, { documents: [], people: [] });

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Héritage</p>
        <h1 className="mt-2 font-heading text-3xl leading-tight sm:text-4xl">Documents historiques</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Photographies, manuscrits, lettres et archives. Le dépôt n&apos;équivaut pas à une validation.
        </p>
      </div>
      <HeritageSubnav />
      {unavailable ? <DatabaseUnavailable /> : null}
      {canWriteGenealogy(actor) ? (
        <DocumentForm people={value.people.map((person) => ({ id: person.id, firstName: person.firstName, lastName: person.lastName }))} />
      ) : null}
      {!unavailable && value.documents.length === 0 ? (
        <EmptyState title="Aucun document" description="Ajoutez une pièce avec son lieu de conservation et son niveau de confiance." />
      ) : (
        <div className="grid gap-4">
          {value.documents.map((document) => (
            <Card key={document.id}>
              <CardHeader>
                <CardTitle>{document.title}</CardTitle>
                <CardDescription>
                  {documentKindLabel(document.kind)} · {confidenceLabel(document.confidenceLevel)} · {validationStatusLabel(document.validationStatus)} · {confidentialityLabel(document.confidentialityLevel)}
                  {document.person ? ` · ${document.person.firstName} ${document.person.lastName}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                {document.dateText || document.authorName || document.archiveLocation ? (
                  <p className="text-muted-foreground">
                    {[document.dateText, document.authorName, document.archiveLocation].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {document.description ? <p className="whitespace-pre-wrap">{document.description}</p> : null}
                {document.fileUrl ? (
                  <a href={document.fileUrl} className="break-all text-primary underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                    Ouvrir le fichier
                  </a>
                ) : null}
                {canWriteGenealogy(actor) && (document.validationStatus === "DRAFT" || document.validationStatus === "REJECTED") ? (
                  <SubmitHeritageButton target="DOCUMENT" targetId={document.id} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
