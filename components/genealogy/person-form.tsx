"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { FamilyBranch, Person } from "@prisma/client";
import { AlertTriangle } from "lucide-react";
import { createPersonAction, type PersonFormState } from "@/lib/genealogy/actions";
import { personDisplayName } from "@/lib/genealogy/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PersonForm({
  branches,
  people,
  spouseOf,
}: {
  branches: FamilyBranch[];
  people: Person[];
  spouseOf?: { id: string; name: string };
}) {
  const [state, formAction, pending] = useActionState<PersonFormState, FormData>(createPersonAction, null);

  return (
    <form action={formAction} className="grid gap-5">
      {spouseOf ? (
        <>
          <input type="hidden" name="spouseOf" value={spouseOf.id} />
          <Alert>
            <AlertTriangle />
            <AlertTitle>Nouvelle conjointe / nouveau conjoint</AlertTitle>
            <AlertDescription>
              Cette fiche sera liée à {spouseOf.name} après enregistrement. Conservez l&apos;orthographe
              de la source et ne fusionnez pas un homonyme.
            </AlertDescription>
          </Alert>
        </>
      ) : null}
      {state?.error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Enregistrement impossible</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state?.homonyms && state.homonyms.length > 0 ? (
        <Alert>
          <AlertTriangle />
          <AlertTitle>Homonymie possible</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Une ou plusieurs personnes portent déjà ce nom. Vérifiez avant de créer une nouvelle fiche.</p>
            <ul className="grid gap-1">
              {state.homonyms.map((person) => (
                <li key={person.id}>
                  <Link className="underline" href={`/espace/personnes/${person.id}`}>
                    {person.name}
                  </Link>
                  {person.cityOfResidence ? ` · ${person.cityOfResidence}` : ""}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">Soumettez à nouveau pour confirmer qu&apos;il s&apos;agit bien d&apos;une autre personne.</p>
            <input type="hidden" name="confirmHomonyms" value="1" />
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" required />
        <Field label="Nom" name="lastName" defaultValue={spouseOf ? "" : "TOURÉ"} required />
        <Field label="Autres noms" name="otherNames" />
        <div className="grid gap-2">
          <Label htmlFor="gender">Genre</Label>
          <select id="gender" name="gender" className={selectClass} defaultValue={spouseOf ? "FEMALE" : "UNKNOWN"}>
            <option value="UNKNOWN">Non précisé</option>
            <option value="FEMALE">Féminin</option>
            <option value="MALE">Masculin</option>
          </select>
        </div>
        <Field label="Naissance (texte, ex. vers 1830)" name="birthDateText" />
        <Field label="Lieu de naissance" name="birthPlace" />
        <Field label="Décès (texte)" name="deathDateText" />
        <Field label="Lieu de décès" name="deathPlace" />
        <Field label="Occupation" name="occupation" />
        <Field label="Ville de résidence" name="cityOfResidence" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="biography">Biographie</Label>
        <Textarea id="biography" name="biography" rows={6} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="familyBranchId">Branche</Label>
          <select id="familyBranchId" name="familyBranchId" className={selectClass} defaultValue="">
            <option value="">Non rattachée</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confidentialityLevel">Confidentialité</Label>
          <select id="confidentialityLevel" name="confidentialityLevel" className={selectClass} defaultValue="C1">
            <option value="C0">C0 · Public</option>
            <option value="C1">C1 · Grande Famille</option>
            <option value="C2">C2 · Descendants directs</option>
            <option value="C3">C3 · Comité restreint</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confidenceLevel">Niveau de confiance</Label>
          <select id="confidenceLevel" name="confidenceLevel" className={selectClass} defaultValue="MEDIUM">
            <option value="LOW">Faible</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Élevée</option>
            <option value="VERY_HIGH">Très élevée</option>
          </select>
        </div>
        <ParentSelect label="Père" name="fatherId" people={people} />
        <ParentSelect label="Mère" name="motherId" people={people} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : "Créer la fiche"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/espace/personnes">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} defaultValue={defaultValue} />
    </div>
  );
}

function ParentSelect({ label, name, people }: { label: string; name: string; people: Person[] }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} className={selectClass} defaultValue="">
        <option value="">Non documenté</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {personDisplayName(person)}
            {person.cityOfResidence ? ` · ${person.cityOfResidence}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
