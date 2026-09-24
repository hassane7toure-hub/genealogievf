import type { Metadata } from "next";
import { AccessDenied } from "@/components/family/access-denied";
import { MeetingForm } from "@/components/family/family-forms";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { EmptyState } from "@/components/heritage/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/lib/auth";
import { canAccessFamilyLife, canWriteFamilyLife } from "@/lib/authorization";
import { listMeetings } from "@/lib/family/queries";
import { formatFamilyDate, meetingStatusLabel } from "@/lib/family/labels";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = { title: "Réunions" };

export default async function MeetingsPage() {
  const actor = await getActor();
  if (!canAccessFamilyLife(actor)) {
    return <AccessDenied title="Réunions" description="Réservées aux membres reconnus de la Grande Famille (C1)." />;
  }

  const { value: meetings, unavailable } = await loadGenealogy(() => listMeetings(actor), []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Réunions</h1>
        <p className="mt-2 text-muted-foreground">Convocations, lieu et ordre du jour de la Grande Famille.</p>
      </div>
      {unavailable ? <DatabaseUnavailable /> : null}
      {canWriteFamilyLife(actor) ? <MeetingForm /> : null}
      {!unavailable && meetings.length === 0 ? (
        <EmptyState title="Aucune réunion" description="La prochaine assemblée sera publiée ici." />
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardHeader>
                <CardTitle>{meeting.title}</CardTitle>
                <CardDescription>
                  {formatFamilyDate(meeting.startsAt)} · {meetingStatusLabel(meeting.status)}
                  {meeting.location ? ` · ${meeting.location}` : ""}
                </CardDescription>
              </CardHeader>
              {meeting.agenda ? <CardContent className="whitespace-pre-wrap text-sm">{meeting.agenda}</CardContent> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
