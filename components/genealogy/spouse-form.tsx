"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Person } from "@prisma/client";
import { AlertTriangle } from "lucide-react";
import { createSpouseAction, type SpouseFormState } from "@/lib/genealogy/actions";
import { personDisplayName } from "@/lib/genealogy/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SpouseForm({
  personId,
  personName,
  people,
}: {
  personId: string;
  personName: string;
  people: Person[];
}) {
  const [state, action, pending] = useActionState<SpouseFormState, FormData>(createSpouseAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un conjoint</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <input type="hidden" name="personId" value={personId} />
          {state?.error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Lien impossible</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Reliez une fiche déjà créée à {personName}. N&apos;inventez pas un mariage : ne rattachez que
            les conjoints documentés, sans fusionner les homonymes.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="spouseId">Conjoint / conjointe</Label>
            <select id="spouseId" name="spouseId" required className={selectClass} defaultValue="">
              <option value="">Choisir une fiche existante</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {personDisplayName(person)}
                  {person.cityOfResidence ? ` · ${person.cityOfResidence}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="kind">Type de lien</Label>
              <select id="kind" name="kind" className={selectClass} defaultValue="MARRIAGE">
                <option value="MARRIAGE">Mariage</option>
                <option value="UNION">Union</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Date (si connue)</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="place">Lieu</Label>
            <Input id="place" name="place" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending || people.length === 0}>
              {pending ? "Enregistrement…" : "Lier le conjoint"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/espace/personnes/nouvelle?conjointDe=${personId}`}>
                Créer une nouvelle fiche et la lier
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
