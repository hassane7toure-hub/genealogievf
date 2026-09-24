import type { Metadata } from "next";
import { AccessDenied } from "@/components/family/access-denied";
import { EventForm } from "@/components/family/family-forms";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { EmptyState } from "@/components/heritage/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/lib/auth";
import { canAccessFamilyLife, canWriteFamilyLife } from "@/lib/authorization";
import { eventKindLabel, formatFamilyDate } from "@/lib/family/labels";
import { listFamilyEvents } from "@/lib/family/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = { title: "Événements" };

export default async function EventsPage() {
  const actor = await getActor();
  if (!canAccessFamilyLife(actor)) {
    return <AccessDenied title="Événements" description="Réservés aux membres reconnus de la Grande Famille (C1)." />;
  }

  const { value: events, unavailable } = await loadGenealogy(() => listFamilyEvents(actor), []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Événements</h1>
        <p className="mt-2 text-muted-foreground">Mariages, funérailles, célébrations et rendez-vous patrimoniaux.</p>
      </div>
      {unavailable ? <DatabaseUnavailable /> : null}
      {canWriteFamilyLife(actor) ? <EventForm /> : null}
      {!unavailable && events.length === 0 ? (
        <EmptyState title="Aucun événement" description="Les dates familiales validées apparaîtront ici." />
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>
                  {eventKindLabel(event.kind)} · {formatFamilyDate(event.startsAt)}
                  {event.location ? ` · ${event.location}` : ""}
                </CardDescription>
              </CardHeader>
              {event.description ? <CardContent className="text-sm">{event.description}</CardContent> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
