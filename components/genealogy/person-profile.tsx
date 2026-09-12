import Link from "next/link";
import { ConfidentialityBadge, ConfidenceBadge, ValidationBadge } from "@/components/heritage/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { personDisplayName, personLifeSpan } from "@/lib/genealogy/format";
import { genderLabel } from "@/lib/labels";
import type { getPersonById } from "@/lib/genealogy/queries";

type RelatedPerson = {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  parentRole?: "MOTHER" | "FATHER";
};

type LoadedPerson = NonNullable<Awaited<ReturnType<typeof getPersonById>>>;

export function PersonProfile({
  person,
  profileHref,
}: {
  person: LoadedPerson;
  profileHref: (id: string) => string;
}) {
  return (
    <article className="grid gap-6">
      <header className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Fiche généalogique</p>
        <h1 className="mt-2 font-heading text-4xl">{personDisplayName(person)}</h1>
        <p className="mt-2 text-muted-foreground">{personLifeSpan(person)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ConfidentialityBadge level={person.confidentialityLevel} />
          <ConfidenceBadge level={person.confidenceLevel} />
          <ValidationBadge status={person.validationStatus} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Biographie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>{person.biography || "Aucune biographie n'est encore rédigée."}</p>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Info label="Genre" value={genderLabel(person.gender)} />
              <Info label="Occupation" value={person.occupation} />
              <Info label="Naissance" value={[person.birthDateText, person.birthPlace].filter(Boolean).join(" · ")} />
              <Info label="Décès" value={[person.deathDateText, person.deathPlace].filter(Boolean).join(" · ")} />
              <Info label="Résidence" value={person.cityOfResidence} />
              <Info label="Branche" value={person.familyBranch?.name} />
            </dl>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <RelationCard
            title="Parents"
            people={person.parents}
            href={profileHref}
            extra={(item) => (item.parentRole === "MOTHER" ? "Mère" : "Père")}
          />
          <RelationCard title="Conjoints" people={person.spouses} href={profileHref} />
          <RelationCard title="Enfants" people={person.children} href={profileHref} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {person.sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune source n&apos;est encore associée. Un témoignage n&apos;est pas un fait établi.</p>
          ) : (
            <ul className="grid gap-3">
              {person.sources.map((item) => (
                <li key={item.id} className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                  <p className="font-medium">{item.source.title}</p>
                  <p className="text-muted-foreground">{item.source.description}</p>
                  {item.notes ? <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </article>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value || "Non documenté"}</dd>
    </div>
  );
}

function RelationCard({
  title,
  people,
  href,
  extra,
}: {
  title: string;
  people: RelatedPerson[];
  href: (id: string) => string;
  extra?: (person: RelatedPerson) => string | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">Non documenté pour le moment.</p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {people.map((person) => (
              <li key={person.id}>
                <Link href={href(person.id)} className="hover:underline">
                  {personDisplayName(person)}
                </Link>
                {extra ? <span className="text-muted-foreground"> · {extra(person)}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
