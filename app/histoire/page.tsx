import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";

export const metadata: Metadata = {
  title: "Histoire",
};

export default function HistoryPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Mémoire publique</p>
        <h1 className="mt-3 font-heading text-4xl">Histoire de la Grande Famille TOURÉ</h1>
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
      </main>
      <SiteFooter />
    </>
  );
}
