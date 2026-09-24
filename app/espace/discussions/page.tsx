import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied } from "@/components/family/access-denied";
import { DiscussionForm } from "@/components/family/family-forms";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { EmptyState } from "@/components/heritage/empty-state";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/lib/auth";
import { canAccessFamilyLife, canWriteFamilyLife } from "@/lib/authorization";
import { discussionStatusLabel, formatFamilyDate } from "@/lib/family/labels";
import { listDiscussions } from "@/lib/family/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = { title: "Discussions" };

export default async function DiscussionsPage() {
  const actor = await getActor();
  if (!canAccessFamilyLife(actor)) {
    return <AccessDenied title="Discussions" description="Réservées aux membres reconnus de la Grande Famille (C1)." />;
  }

  const { value: discussions, unavailable } = await loadGenealogy(() => listDiscussions(actor), []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-4xl">Discussions et votes</h1>
        <p className="mt-2 text-muted-foreground">Chaque voix est nominative et journalisée.</p>
      </div>
      {unavailable ? <DatabaseUnavailable /> : null}
      {canWriteFamilyLife(actor) ? <DiscussionForm /> : null}
      {!unavailable && discussions.length === 0 ? (
        <EmptyState title="Aucune discussion" description="Ouvrez un sujet pour débattre ou voter." />
      ) : (
        <div className="grid gap-3">
          {discussions.map((discussion) => (
            <Link key={discussion.id} href={`/espace/discussions/${discussion.id}`}>
              <Card className="transition-colors hover:ring-primary/30">
                <CardHeader>
                  <CardTitle>{discussion.title}</CardTitle>
                  <CardDescription>
                    {discussionStatusLabel(discussion.status)} · {discussion._count.comments} commentaire
                    {discussion._count.comments > 1 ? "s" : ""} · {discussion._count.votes} vote
                    {discussion._count.votes > 1 ? "s" : ""} · {formatFamilyDate(discussion.createdAt)}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
