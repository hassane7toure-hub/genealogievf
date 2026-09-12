import Link from "next/link";
import type { FamilyBranch, Person } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidentialityBadge, ConfidenceBadge, ValidationBadge } from "@/components/heritage/status-badges";
import { personDisplayName, personLifeSpan } from "@/lib/genealogy/format";

export function PersonCard({
  person,
  href,
}: {
  person: Person & { familyBranch: FamilyBranch | null };
  href: string;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full transition-transform hover:-translate-y-0.5">
        <CardHeader>
          <CardTitle className="font-heading text-xl">{personDisplayName(person)}</CardTitle>
          <CardDescription>{personLifeSpan(person)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {person.familyBranch ? (
            <span className="text-xs text-muted-foreground">{person.familyBranch.name}</span>
          ) : null}
          {person.cityOfResidence ? (
            <span className="text-xs text-muted-foreground">{person.cityOfResidence}</span>
          ) : null}
          <ConfidentialityBadge level={person.confidentialityLevel} />
          <ConfidenceBadge level={person.confidenceLevel} />
          <ValidationBadge status={person.validationStatus} />
        </CardContent>
      </Card>
    </Link>
  );
}
