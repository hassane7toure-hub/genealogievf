import type { ConfidentialityLevel, ConfidenceLevel, ValidationStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { confidentialityLabel } from "@/lib/authorization";
import { confidenceLabel, validationLabel } from "@/lib/labels";

export function ConfidentialityBadge({ level }: { level: ConfidentialityLevel }) {
  return <Badge variant={level === "C0" ? "secondary" : "outline"}>{level} · {confidentialityLabel(level)}</Badge>;
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return <Badge variant="outline">Confiance {confidenceLabel(level).toLowerCase()}</Badge>;
}

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  return <Badge variant={status === "PUBLISHED" ? "default" : "secondary"}>{validationLabel(status)}</Badge>;
}
