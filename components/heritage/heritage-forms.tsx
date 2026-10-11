"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  commentValidationAction,
  createDocumentAction,
  createMeetingReportAction,
  createSourceAction,
  createTestimonyAction,
  decideValidationAction,
  publishHeritageAction,
  submitHeritageAction,
  type HeritageFormState,
} from "@/lib/heritage/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export type PersonOption = { id: string; firstName: string; lastName: string };
export type ReportOption = { id: string; title: string };

function FormError({ state }: { state: HeritageFormState }) {
  if (!state?.error) return null;
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>Enregistrement impossible</AlertTitle>
      <AlertDescription>{state.error}</AlertDescription>
    </Alert>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}

function Levels({ defaultConfidence = "MEDIUM" }: { defaultConfidence?: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="confidentialityLevel">Confidentialité</Label>
        <select id="confidentialityLevel" name="confidentialityLevel" className={selectClass} defaultValue="C1">
          <option value="C0">C0 — pourra être publié après validation</option>
          <option value="C1">C1 — Grande Famille</option>
          <option value="C2">C2 — descendants directs</option>
          <option value="C3">C3 — comité restreint</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confidenceLevel">Confiance</Label>
        <select id="confidenceLevel" name="confidenceLevel" className={selectClass} defaultValue={defaultConfidence}>
          <option value="LOW">Faible</option>
          <option value="MEDIUM">Moyen</option>
          <option value="HIGH">Élevé</option>
          <option value="VERY_HIGH">Très élevé</option>
        </select>
      </div>
    </div>
  );
}

function PersonField({ people }: { people: PersonOption[] }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="personId">Personne liée</Label>
      <select id="personId" name="personId" className={selectClass} defaultValue="">
        <option value="">Aucune</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.firstName} {person.lastName}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SourceForm({ people }: { people: PersonOption[] }) {
  const [state, action, pending] = useActionState<HeritageFormState, FormData>(createSourceAction, null);
  return (
    <form action={action} className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl">Déposer une source</h2>
      <FormError state={state} />
      <Field name="title" label="Titre" required />
      <div className="grid gap-2">
        <Label htmlFor="type">Type</Label>
        <select id="type" name="type" className={selectClass} defaultValue="FAMILY_ARCHIVE">
          <option value="ORAL_TESTIMONY">Témoignage oral</option>
          <option value="FAMILY_ARCHIVE">Archive familiale</option>
          <option value="OFFICIAL_DOCUMENT">Document officiel</option>
          <option value="HISTORICAL_BOOK">Livre historique</option>
          <option value="ACADEMIC_PUBLICATION">Publication académique</option>
          <option value="ADMINISTRATIVE_DOCUMENT">Document administratif</option>
          <option value="PHOTOGRAPH">Photographie</option>
          <option value="FAMILY_WITNESS">Témoin familial</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="author" label="Auteur" />
        <Field name="url" label="Adresse" type="url" />
      </div>
      <PersonField people={people} />
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>
      <Levels />
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer le brouillon"}</Button>
    </form>
  );
}

export function TestimonyForm({ people }: { people: PersonOption[] }) {
  const [state, action, pending] = useActionState<HeritageFormState, FormData>(createTestimonyAction, null);
  return (
    <form action={action} className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl">Recueillir un témoignage</h2>
      <p className="text-sm text-muted-foreground">
        Un témoignage oral n&apos;est pas un fait établi. Il reste un brouillon tant que le comité ne l&apos;a pas validé avec un procès-verbal.
      </p>
      <FormError state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="title" label="Titre" required />
        <Field name="speakerName" label="Personne qui témoigne" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="location" label="Lieu" />
        <Field name="historicalPeriod" label="Période" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="stage">Étape du recueil</Label>
        <select id="stage" name="stage" className={selectClass} defaultValue="RAW">
          <option value="RAW">Témoignage brut</option>
          <option value="TRANSCRIBED">Transcrit</option>
          <option value="REVIEWED">Relu</option>
        </select>
      </div>
      <PersonField people={people} />
      <div className="grid gap-2">
        <Label htmlFor="summary">Résumé</Label>
        <Textarea id="summary" name="summary" rows={3} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="transcript">Transcription</Label>
        <Textarea id="transcript" name="transcript" rows={5} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="audioUrl" label="Audio" type="url" />
        <Field name="videoUrl" label="Vidéo" type="url" />
      </div>
      <Levels defaultConfidence="LOW" />
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer le brouillon"}</Button>
    </form>
  );
}

export function DocumentForm({ people }: { people: PersonOption[] }) {
  const [state, action, pending] = useActionState<HeritageFormState, FormData>(createDocumentAction, null);
  return (
    <form action={action} className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl">Ajouter un document</h2>
      <FormError state={state} />
      <Field name="title" label="Titre" required />
      <div className="grid gap-2">
        <Label htmlFor="kind">Nature</Label>
        <select id="kind" name="kind" className={selectClass} defaultValue="HISTORICAL">
          <option value="HISTORICAL">Document historique</option>
          <option value="FAMILY_RECORD">Archive familiale</option>
          <option value="PHOTO">Photographie</option>
          <option value="MANUSCRIPT">Manuscrit</option>
          <option value="ADMINISTRATIVE">Document administratif</option>
          <option value="GENEALOGICAL">Document généalogique</option>
          <option value="BOOK">Livre</option>
          <option value="LETTER">Lettre</option>
          <option value="MAP">Carte</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="dateText" label="Date indiquée" />
        <Field name="authorName" label="Auteur" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="archiveLocation" label="Lieu de conservation" />
        <Field name="historicalPeriod" label="Période" />
      </div>
      <Field name="fileUrl" label="Fichier" type="url" />
      <PersonField people={people} />
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>
      <Levels />
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer le brouillon"}</Button>
    </form>
  );
}

export function MeetingReportForm() {
  const [state, action, pending] = useActionState<HeritageFormState, FormData>(createMeetingReportAction, null);
  return (
    <form action={action} className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl">Rédiger un procès-verbal</h2>
      <p className="text-sm text-muted-foreground">
        Aucune pièce sensible n&apos;est approuvée sans procès-verbal. Cochez la publication seulement si le compte rendu peut être public.
      </p>
      <FormError state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="title" label="Titre" required />
        <Field name="meetingDate" label="Date" type="date" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="membersText">Membres présents</Label>
        <Textarea id="membersText" name="membersText" rows={3} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="decision">Décision</Label>
        <Textarea id="decision" name="decision" rows={4} required />
      </div>
      <Field name="signatureNote" label="Mention de signature" />
      <Field name="fileUrl" label="Fichier du procès-verbal" type="url" />
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="published" className="size-4" />
        Publier ce procès-verbal (niveau C0)
      </label>
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer le procès-verbal"}</Button>
    </form>
  );
}

export function DecisionForm({ requestId, reports }: { requestId: string; reports: ReportOption[] }) {
  const [state, action, pending] = useActionState<HeritageFormState, FormData>(decideValidationAction, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="requestId" value={requestId} />
      <FormError state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`kind-${requestId}`}>Décision</Label>
          <select id={`kind-${requestId}`} name="kind" className={selectClass} defaultValue="REVISION">
            <option value="REVISION">Demander une révision</option>
            <option value="REJECTED">Rejeter</option>
            <option value="APPROVED">Approuver</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`report-${requestId}`}>Procès-verbal</Label>
          <select id={`report-${requestId}`} name="meetingReportId" className={selectClass} defaultValue="">
            <option value="">Aucun</option>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>{report.title}</option>
            ))}
          </select>
        </div>
      </div>
      <Textarea name="notes" rows={3} placeholder="Motif de la décision" />
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer la décision"}</Button>
    </form>
  );
}

export function CommentForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState<HeritageFormState, FormData>(commentValidationAction, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="requestId" value={requestId} />
      <FormError state={state} />
      <Textarea name="body" rows={3} placeholder="Commentaire du comité" required />
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "Envoi…" : "Commenter"}</Button>
    </form>
  );
}

export function SubmitHeritageButton({
  target,
  targetId,
}: {
  target: "SOURCE" | "TESTIMONY" | "DOCUMENT";
  targetId: string;
}) {
  return (
    <form action={submitHeritageAction}>
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="targetId" value={targetId} />
      <Button type="submit" variant="outline">Soumettre au comité</Button>
    </form>
  );
}

export function PublishHeritageButton({
  target,
  targetId,
}: {
  target: "SOURCE" | "TESTIMONY" | "DOCUMENT";
  targetId: string;
}) {
  return (
    <form action={publishHeritageAction}>
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="targetId" value={targetId} />
      <Button type="submit">Publier sur la page Histoire</Button>
    </form>
  );
}
