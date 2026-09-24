import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/family/access-denied";
import { CommentForm } from "@/components/family/family-forms";
import { VoteButtons } from "@/components/family/vote-buttons";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/lib/auth";
import { canAccessFamilyLife, canWriteFamilyLife } from "@/lib/authorization";
import { discussionStatusLabel, formatFamilyDate, voteChoiceLabel } from "@/lib/family/labels";
import { getDiscussion } from "@/lib/family/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = { title: "Discussion" };

export default async function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ discussionId: string }>;
}) {
  const { discussionId } = await params;
  const actor = await getActor();
  if (!canAccessFamilyLife(actor)) {
    return <AccessDenied title="Discussion" description="Réservée aux membres reconnus de la Grande Famille (C1)." />;
  }

  const { value: discussion, unavailable } = await loadGenealogy(
    () => getDiscussion(actor, discussionId),
    null,
  );

  if (unavailable) return <DatabaseUnavailable />;
  if (!discussion) notFound();

  const tally = {
    FOR: discussion.votes.filter((vote) => vote.choice === "FOR").length,
    AGAINST: discussion.votes.filter((vote) => vote.choice === "AGAINST").length,
    ABSTAIN: discussion.votes.filter((vote) => vote.choice === "ABSTAIN").length,
  };
  const myVote = actor.user ? discussion.votes.find((vote) => vote.voterUserId === actor.user?.id) : undefined;

  return (
    <div className="grid gap-6">
      <p className="text-sm">
        <Link href="/espace/discussions" className="text-muted-foreground hover:underline">
          ← Discussions
        </Link>
      </p>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {discussionStatusLabel(discussion.status)}
        </p>
        <h1 className="mt-1 font-heading text-3xl leading-tight sm:text-4xl">{discussion.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{formatFamilyDate(discussion.createdAt)}</p>
      </div>
      <Card>
        <CardContent className="pt-4 whitespace-pre-wrap text-sm leading-7">{discussion.body}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Vote</CardTitle>
          <CardDescription>
            Pour {tally.FOR} · Contre {tally.AGAINST} · Abstention {tally.ABSTAIN}
            {myVote ? ` · votre voix : ${voteChoiceLabel(myVote.choice)}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {discussion.status === "OPEN" && canWriteFamilyLife(actor) ? (
            <VoteButtons discussionId={discussion.id} />
          ) : (
            <p className="text-sm text-muted-foreground">Le vote n&apos;est plus ouvert, ou vous n&apos;êtes pas habilité à voter.</p>
          )}
        </CardContent>
      </Card>
      <section className="grid gap-4">
        <h2 className="font-heading text-2xl">Commentaires</h2>
        {discussion.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun commentaire pour le moment.</p>
        ) : (
          discussion.comments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader>
                <CardTitle className="text-sm">
                  {[comment.author?.firstName, comment.author?.lastName].filter(Boolean).join(" ") || "Membre"}
                </CardTitle>
                <CardDescription>{formatFamilyDate(comment.createdAt)}</CardDescription>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">{comment.body}</CardContent>
            </Card>
          ))
        )}
        {discussion.status === "OPEN" && canWriteFamilyLife(actor) ? <CommentForm discussionId={discussion.id} /> : null}
      </section>
    </div>
  );
}
