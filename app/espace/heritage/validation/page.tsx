import type { Metadata } from "next";
import { AccessDenied } from "@/components/family/access-denied";
import {
  CommentForm,
  DecisionForm,
  MeetingReportForm,
  PublishHeritageButton,
} from "@/components/heritage/heritage-forms";
import { HeritageSubnav } from "@/components/heritage/heritage-subnav";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { EmptyState } from "@/components/heritage/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/lib/auth";
import { canAccessFamilyLife, canManageCommittee, confidentialityLabel } from "@/lib/authorization";
import { decisionKindLabel, heritageTargetLabel, validationStatusLabel } from "@/lib/heritage/labels";
import { listMeetingReports, listValidationRequests } from "@/lib/heritage/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = { title: "Validation" };

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

export default async function ValidationPage() {
  const actor = await getActor();
  if (!canAccessFamilyLife(actor)) {
    return <AccessDenied title="Validation" description="Le suivi des pièces soumises est réservé aux membres reconnus de la Grande Famille (C1)." />;
  }

  const committee = canManageCommittee(actor);
  const { value, unavailable } = await loadGenealogy(async () => {
    const [requests, reports] = await Promise.all([
      listValidationRequests(actor),
      listMeetingReports(actor),
    ]);
    return { requests, reports };
  }, { requests: [], reports: [] });

  const openCount = value.requests.filter((request) => request.status === "SUBMITTED" || request.status === "UNDER_REVIEW").length;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Comité de validation</p>
        <h1 className="mt-2 font-heading text-3xl leading-tight sm:text-4xl">Validation</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {openCount} demande{openCount > 1 ? "s" : ""} en attente. L&apos;approbation d&apos;une pièce exige un procès-verbal. La publication publique n&apos;est possible qu&apos;au niveau C0, après approbation.
        </p>
      </div>
      <HeritageSubnav />
      {unavailable ? <DatabaseUnavailable /> : null}
      {committee ? <MeetingReportForm /> : null}

      {value.reports.length > 0 ? (
        <div className="grid gap-4">
          <h2 className="font-heading text-2xl">Procès-verbaux</h2>
          {value.reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription>
                  {formatDate(report.meetingDate)} · {confidentialityLabel(report.confidentialityLevel)}
                  {report.published ? " · publié" : " · interne"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <p className="whitespace-pre-wrap">{report.decision}</p>
                <p className="text-muted-foreground">Présents : {report.membersText}</p>
                {report.signatureNote ? <p className="text-muted-foreground">{report.signatureNote}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!unavailable && value.requests.length === 0 ? (
        <EmptyState title="Aucune demande" description="Les brouillons soumis depuis les sources, témoignages et documents apparaissent ici." />
      ) : (
        <div className="grid gap-4">
          {value.requests.map((request) => {
            const pending = request.status === "SUBMITTED" || request.status === "UNDER_REVIEW";
            return (
              <Card key={request.id}>
                <CardHeader>
                  <CardTitle>{request.targetTitle}</CardTitle>
                  <CardDescription>
                    {heritageTargetLabel(request.target)} · {validationStatusLabel(request.status)} · {confidentialityLabel(request.targetLevel)}
                    {request.submittedBy ? ` · ${[request.submittedBy.firstName, request.submittedBy.lastName].filter(Boolean).join(" ") || "Membre"}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm">
                  {request.comments.map((comment) => (
                    <p key={comment.id} className="whitespace-pre-wrap rounded-lg bg-muted px-3 py-2">
                      {comment.body}
                    </p>
                  ))}
                  {request.decisions.map((decision) => (
                    <p key={decision.id} className="text-muted-foreground">
                      {decisionKindLabel(decision.kind)}
                      {decision.meetingReport ? ` — PV : ${decision.meetingReport.title}` : ""}
                      {decision.notes ? ` — ${decision.notes}` : ""}
                    </p>
                  ))}
                  {committee && pending ? (
                    <>
                      <DecisionForm
                        requestId={request.id}
                        reports={value.reports.map((report) => ({ id: report.id, title: report.title }))}
                      />
                      <CommentForm requestId={request.id} />
                    </>
                  ) : null}
                  {committee && request.status === "APPROVED" && request.targetLevel === "C0" ? (
                    <PublishHeritageButton target={request.target} targetId={request.targetId} />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
