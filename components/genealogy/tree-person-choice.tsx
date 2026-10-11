"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TreePersonOption = { id: string; label: string };

export function TreePersonChoice({
  people,
  selectedId,
  actionPath,
}: {
  people: TreePersonOption[];
  selectedId?: string;
  actionPath: string;
}) {
  const [query, setQuery] = useState("");
  const options = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr");
    const matches = needle
      ? people.filter((person) => person.label.toLocaleLowerCase("fr").includes(needle))
      : people;
    if (!selectedId || matches.some((person) => person.id === selectedId)) return matches;
    const selected = people.find((person) => person.id === selectedId);
    return selected ? [selected, ...matches] : matches;
  }, [people, query, selectedId]);

  return (
    <form action={actionPath} className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="grid gap-2">
        <Label htmlFor="filtre-personne">Afficher l&apos;arbre à partir de</Label>
        <Input
          id="filtre-personne"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filtrer par nom ou prénom"
          autoComplete="off"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-2">
          <Label htmlFor="personne">Personne</Label>
          <select
            id="personne"
            name="personne"
            key={selectedId ?? "aucune"}
            defaultValue={selectedId ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">Choisir une personne</option>
            <option value="lignee">Lignée complète</option>
            {options.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Afficher</Button>
      </div>
      {selectedId && selectedId !== "lignee" ? (
        <Link href={`${actionPath}?personne=lignee`} className="text-sm text-primary underline-offset-4 hover:underline">
          Afficher la lignée complète
        </Link>
      ) : null}
    </form>
  );
}
