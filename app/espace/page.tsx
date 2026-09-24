import Link from "next/link";
import type { Metadata } from "next";
import { Trees, Users, Search, Shield, CalendarDays, Calendar, MessagesSquare, Wallet, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SetupBanner } from "@/components/heritage/setup-banner";
import { getActor } from "@/lib/auth";
import { genealogicalStatusLabel, maxConfidentialityFor, roleLabel } from "@/lib/authorization";
import { listVisiblePeople } from "@/lib/genealogy/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";
import { isDatabaseConfigured } from "@/lib/env";
import { listUpcomingMeetings, unreadNotificationCount } from "@/lib/family/queries";
import { formatFamilyDate } from "@/lib/family/labels";

export const metadata: Metadata = {
  title: "Espace famille",
};

export default async function DashboardPage() {
  const actor = await getActor();
  const { value } = await loadGenealogy(async () => {
    const [people, meetings, unread] = await Promise.all([
      listVisiblePeople(actor),
      listUpcomingMeetings(actor),
      unreadNotificationCount(actor),
    ]);
    return { people, meetings, unread };
  }, { people: [], meetings: [], unread: 0 });
  const people = value.people;
  const level = maxConfidentialityFor(actor);

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Espace authentifié</p>
        <h1 className="mt-2 font-heading text-3xl leading-tight sm:text-4xl">Tableau de bord</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Clerk identifie. L&apos;application autorise. Votre rôle et votre statut généalogique sont distincts.
        </p>
      </div>
      <SetupBanner />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <CardContent className="font-heading text-3xl leading-tight sm:text-4xl">{isDatabaseConfigured() ? people.length : "—"}</CardContent>
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Shortcut href="/espace/personnes" icon={Users} title="Personnes" text="Consulter et, si vous y êtes autorisé, ajouter une fiche." />
        <Shortcut href="/espace/arbre" icon={Trees} title="Arbre" text="Naviguer depuis Lanfia TOURÉ." />
        <Shortcut href="/espace/recherche" icon={Search} title="Recherche interne" text="Chercher dans le périmètre autorisé." />
        <Shortcut href="/espace/reunions" icon={CalendarDays} title="Réunions" text="Convocations et ordres du jour." />
        <Shortcut href="/espace/evenements" icon={Calendar} title="Événements" text="Mariages, funérailles et rendez-vous patrimoniaux." />
        <Shortcut href="/espace/discussions" icon={MessagesSquare} title="Discussions" text="Débattre et voter, voix nominative." />
        <Shortcut href="/espace/caisse" icon={Wallet} title="Caisse" text="Cotisations et dépenses du comité." />
        <Shortcut href="/espace/notifications" icon={Bell} title="Notifications" text={`${value.unread} alerte${value.unread > 1 ? "s" : ""} non lue${value.unread > 1 ? "s" : ""}.`} />
      </div>
      {value.meetings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Prochaines réunions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {value.meetings.map((meeting) => (
              <p key={meeting.id}>
                <span className="font-medium">{meeting.title}</span>
                <span className="text-muted-foreground"> — {formatFamilyDate(meeting.startsAt)}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}
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
