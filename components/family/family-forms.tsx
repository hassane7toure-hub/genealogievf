"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  addCommentAction,
  createContributionAction,
  createEventAction,
  createExpenseAction,
  createMeetingAction,
  createDiscussionAction,
  type FamilyFormState,
} from "@/lib/family/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function FormError({ state }: { state: FamilyFormState }) {
  if (!state?.error) return null;
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>Enregistrement impossible</AlertTitle>
      <AlertDescription>{state.error}</AlertDescription>
    </Alert>
  );
}

export function MeetingForm() {
  const [state, action, pending] = useActionState<FamilyFormState, FormData>(createMeetingAction, null);
  return (
    <form action={action} className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl">Annoncer une réunion</h2>
      <FormError state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="title" label="Titre" required />
        <Field name="startsAt" label="Date et heure" type="datetime-local" required />
      </div>
      <Field name="location" label="Lieu" />
      <div className="grid gap-2">
        <Label htmlFor="agenda">Ordre du jour</Label>
        <Textarea id="agenda" name="agenda" rows={4} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Publier la réunion"}</Button>
    </form>
  );
}

export function EventForm() {
  const [state, action, pending] = useActionState<FamilyFormState, FormData>(createEventAction, null);
  return (
    <form action={action} className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl">Ajouter un événement</h2>
      <FormError state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="title" label="Titre" required />
        <Field name="startsAt" label="Date et heure" type="datetime-local" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="kind">Type</Label>
        <select id="kind" name="kind" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
          <option value="OTHER">Autre</option>
          <option value="FAMILY_MEETING">Réunion familiale</option>
          <option value="WEDDING">Mariage</option>
          <option value="BAPTISM">Baptême</option>
          <option value="FUNERAL">Funérailles</option>
          <option value="CULTURAL">Événement culturel</option>
          <option value="HERITAGE">Patrimoine</option>
          <option value="ANNIVERSARY">Anniversaire</option>
        </select>
      </div>
      <Field name="location" label="Lieu" />
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Publier l'événement"}</Button>
    </form>
  );
}

export function DiscussionForm() {
  const [state, action, pending] = useActionState<FamilyFormState, FormData>(createDiscussionAction, null);
  return (
    <form action={action} className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl">Ouvrir une discussion</h2>
      <FormError state={state} />
      <Field name="title" label="Sujet" required />
      <div className="grid gap-2">
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" name="body" rows={5} required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Ouverture…" : "Ouvrir la discussion"}</Button>
    </form>
  );
}

export function CommentForm({ discussionId }: { discussionId: string }) {
  const [state, action, pending] = useActionState<FamilyFormState, FormData>(addCommentAction, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="discussionId" value={discussionId} />
      <FormError state={state} />
      <Textarea name="body" rows={3} placeholder="Votre commentaire" required />
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Envoi…" : "Commenter"}
      </Button>
    </form>
  );
}

export function ContributionForm() {
  const [state, action, pending] = useActionState<FamilyFormState, FormData>(createContributionAction, null);
  return (
    <form action={action} className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl">Enregistrer une cotisation</h2>
      <FormError state={state} />
      <Field name="contributorName" label="Contributeur" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="amount" label="Montant (GNF)" type="number" required />
        <Field name="paidAt" label="Date" type="date" required />
      </div>
      <Field name="purpose" label="Objet" />
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Ajouter"}</Button>
    </form>
  );
}

export function ExpenseForm() {
  const [state, action, pending] = useActionState<FamilyFormState, FormData>(createExpenseAction, null);
  return (
    <form action={action} className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl">Enregistrer une dépense</h2>
      <FormError state={state} />
      <Field name="title" label="Libellé" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="amount" label="Montant (GNF)" type="number" required />
        <Field name="spentAt" label="Date" type="date" required />
      </div>
      <Field name="category" label="Catégorie" />
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Ajouter"}</Button>
    </form>
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
