import Link from "next/link";
import type { Metadata } from "next";
import { Trees, Users, Search, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SetupBanner } from "@/components/heritage/setup-banner";
import { getActor } from "@/lib/auth";
import { genealogicalStatusLabel, maxConfidentialityFor, roleLabel } from "@/lib/authorization";
import { listVisiblePeople } from "@/lib/genealogy/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";
import { isDatabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Espace famille",
};

export default async function DashboardPage() {
  const actor = await getActor();
  const { value: people } = await loadGenealogy(() => listVisiblePeople(actor), []);
  const level = maxConfidentialityFor(actor);

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Espace authentifié</p>
        <h1 className="mt-2 font-heading text-4xl">Tableau de bord</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Clerk identifie. L&apos;application autorise. Votre rôle et votre statut généalogique sont distincts.
        </p>
      </div>
      <SetupBanner />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Autorisation</CardTitle>
            <CardDescription>{actor.user ? roleLabel(actor.user.role) : "Invité"}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Statut généalogique : {actor.user ? genealogicalStatusLabel(actor.user.genealogicalStatus) : "Non rattaché"}
            <br />
            Accès maximal : {level}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fiches visibles</CardTitle>
            <CardDescription>Selon votre niveau de confidentialité</CardDescription>
          </CardHeader>
          <CardContent className="font-heading text-4xl">{isDatabaseConfigured() ? people.length : "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Shield className="size-5 text-primary" />
            <CardTitle>Rappel</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            C2 dépend du statut de descendant direct, pas de la présence à une réunion.
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Shortcut href="/espace/personnes" icon={Users} title="Personnes" text="Consulter et, si vous y êtes autorisé, ajouter une fiche." />
        <Shortcut href="/espace/arbre" icon={Trees} title="Arbre" text="Naviguer depuis Lanfia TOURÉ." />
        <Shortcut href="/espace/recherche" icon={Search} title="Recherche interne" text="Chercher dans le périmètre autorisé." />
      </div>
    </div>
  );
}

function Shortcut({
  href,
  icon: Icon,
  title,
  text,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  text: string;
}) {
  return (
    <Card>
      <CardHeader>
        <Icon className="size-5 text-primary" />
        <CardTitle>{title}</CardTitle>
        <CardDescription>{text}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link href={href}>Ouvrir</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
