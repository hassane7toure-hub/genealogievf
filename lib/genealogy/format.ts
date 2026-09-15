import type { Person } from "@prisma/client";

export function personTreeName(person: Pick<Person, "firstName" | "lastName">): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function personDisplayName(person: Pick<Person, "firstName" | "lastName" | "otherNames">): string {
  const base = personTreeName(person);
  return person.otherNames ? `${base} (${person.otherNames})` : base;
}

export function personLifeSpan(person: Pick<Person, "birthDate" | "birthDateText" | "deathDate" | "deathDateText">): string {
  const birth = formatFlexibleDate(person.birthDate, person.birthDateText);
  const death = formatFlexibleDate(person.deathDate, person.deathDateText);
  if (birth && death) return `${birth} — ${death}`;
  if (birth) return `n. ${birth}`;
  if (death) return `† ${death}`;
  return "Dates non documentées";
}

export function formatFlexibleDate(date: Date | null | undefined, text: string | null | undefined): string | null {
  if (text?.trim()) return text.trim();
  if (!date) return null;
  return new Intl.DateTimeFormat("fr-FR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}
