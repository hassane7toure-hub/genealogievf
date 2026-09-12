import Link from "next/link";
import Image from "next/image";
import { Trees, ScrollText, Shield, Users } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { SetupBanner } from "@/components/heritage/setup-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/lib/auth";
import { BRAND_PORTRAIT, BRAND_PORTRAIT_ALT } from "@/lib/brand";
import { getRootPerson, listVisiblePeople } from "@/lib/genealogy/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";
import { personDisplayName } from "@/lib/genealogy/format";

export default async function HomePage() {
  const actor = await getActor();
  const { value: root } = await loadGenealogy(() => getRootPerson(actor), null);
  const { value: people } = await loadGenealogy(() => listVisiblePeople(actor), []);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.9_0.06_80),transparent_42%),radial-gradient(circle_at_bottom_right,oklch(0.9_0.04_140),transparent_36%)]" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Grande Famille TOURÉ</p>
              <h1 className="mt-4 max-w-xl font-heading text-5xl leading-tight sm:text-6xl">
                TOURÉ FAMILY HERITAGE
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                Un lieu pour préserver, organiser, valider et transmettre la mémoire généalogique,
                historique et culturelle de la lignée, en commençant par Lanfia TOURÉ.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/genealogie">Explorer la généalogie</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/arbre">Voir l&apos;arbre</Link>
                </Button>
              </div>
            </div>
            <Card className="self-center overflow-hidden bg-card/90 backdrop-blur-sm">
              <Image
                src={BRAND_PORTRAIT}
                alt={BRAND_PORTRAIT_ALT}
                width={720}
                height={720}
                priority
                className="aspect-[4/5] w-full object-cover object-[center_12%]"
              />
              <CardHeader>
                <CardTitle>Racine de la lignée</CardTitle>
                <CardDescription>Point de départ officiel de la généalogie suivie ici.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl">{root ? personDisplayName(root) : "Lanfia TOURÉ"}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {people.length > 0
                    ? `${people.length} fiche${people.length > 1 ? "s" : ""} actuellement visible${people.length > 1 ? "s" : ""} selon votre niveau d'accès.`
                    : "Les fiches publiques apparaîtront dès que la base sera connectée."}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <SetupBanner />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Feature icon={Trees} title="Généalogie" text="Personnes, branches, parents, conjoints et homonymes." />
            <Feature icon={ScrollText} title="Mémoire" text="Sources, confiance et distinction entre témoignage et fait établi." />
            <Feature icon={Shield} title="Confidentialité" text="C0 public, C1 famille, C2 descendants, C3 comité — contrôlé côté serveur." />
            <Feature icon={Users} title="Espace famille" text="Tableau de bord authentifié pour les membres reconnus." />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof Trees; title: string; text: string }) {
  return (
    <Card>
      <CardHeader>
        <Icon className="size-5 text-primary" />
        <CardTitle>{title}</CardTitle>
        <CardDescription>{text}</CardDescription>
      </CardHeader>
    </Card>
  );
}
