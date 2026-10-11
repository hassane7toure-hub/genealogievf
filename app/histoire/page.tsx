import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { loadGenealogy } from "@/lib/genealogy/safe";
import { confidenceLabel, documentKindLabel, sourceTypeLabel } from "@/lib/heritage/labels";
import { listPublicHeritage } from "@/lib/heritage/queries";

export const metadata: Metadata = {
  title: "Histoire",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

export default async function HistoryPage() {
  const { value } = await loadGenealogy(() => listPublicHeritage(), {
    testimonies: [],
    documents: [],
    sources: [],
    reports: [],
  });
  const hasPublications =
    value.sources.length + value.testimonies.length + value.documents.length + value.reports.length > 0;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Mémoire publique</p>
        <h1 className="mt-3 font-heading text-3xl leading-tight sm:text-4xl">Histoire de la Grande Famille TOURÉ</h1>
        <div className="mt-8 space-y-6 text-base leading-8 text-muted-foreground">
          <p>
            Cette page rassemble des informations publiques (niveau C0) destinées à la transmission.
            Elle n&apos;a pas vocation à transformer un souvenir oral en vérité historique définitive.
          </p>
          <p>
            La généalogie suivie par la plateforme commence à <strong className="text-foreground">Lanfia TOURÉ</strong>.
            Chaque génération ajoutée devra porter une source, un niveau de confiance et, pour les
            informations sensibles, une validation du comité familial.
          </p>
          <p>
            Almamy Samory TOURÉ, figure historique documentée de la lignée, est enregistré comme
            personnalité publique. Le chaînage exact vers Lanfia reste volontairement ouvert : il
            sera établi lorsqu&apos;une source, un témoignage revu et un procès-verbal de validation
            le permettront.
          </p>
          <p>
            Les documents internes, discussions, finances et décisions de comité n&apos;apparaissent
            pas ici. Ils relèvent des niveaux C1 à C3, accessibles uniquement après authentification
            et autorisation côté serveur.
          </p>
        </div>
        {hasPublications ? (
          <div className="mt-10 grid gap-8">
            {value.sources.length > 0 ? (
              <section className="grid gap-4">
                <h2 className="font-heading text-2xl">Sources publiées</h2>
                {value.sources.map((source) => (
                  <article key={source.id} className="grid gap-1">
                    <h3 className="font-medium">{source.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {sourceTypeLabel(source.type)} · confiance {confidenceLabel(source.confidenceLevel).toLowerCase()}
                    </p>
                    {source.description ? <p className="whitespace-pre-wrap text-muted-foreground">{source.description}</p> : null}
                  </article>
                ))}
              </section>
            ) : null}
            {value.testimonies.length > 0 ? (
              <section className="grid gap-4">
                <h2 className="font-heading text-2xl">Témoignages publiés</h2>
                {value.testimonies.map((testimony) => (
                  <article key={testimony.id} className="grid gap-1">
                    <h3 className="font-medium">{testimony.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Témoignage de {testimony.speakerName} · confiance {confidenceLabel(testimony.confidenceLevel).toLowerCase()}. Ce récit reste un témoignage, même après publication.
                    </p>
                    {testimony.summary ? <p className="whitespace-pre-wrap text-muted-foreground">{testimony.summary}</p> : null}
                  </article>
                ))}
              </section>
            ) : null}
            {value.documents.length > 0 ? (
              <section className="grid gap-4">
                <h2 className="font-heading text-2xl">Documents publiés</h2>
                {value.documents.map((document) => (
                  <article key={document.id} className="grid gap-1">
                    <h3 className="font-medium">{document.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {documentKindLabel(document.kind)} · confiance {confidenceLabel(document.confidenceLevel).toLowerCase()}
                    </p>
                    {document.description ? <p className="whitespace-pre-wrap text-muted-foreground">{document.description}</p> : null}
                  </article>
                ))}
              </section>
            ) : null}
            {value.reports.length > 0 ? (
              <section className="grid gap-4">
                <h2 className="font-heading text-2xl">Procès-verbaux publics</h2>
                {value.reports.map((report) => (
                  <article key={report.id} className="grid gap-1">
                    <h3 className="font-medium">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(report.meetingDate)}</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{report.decision}</p>
                  </article>
                ))}
              </section>
            ) : null}
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
