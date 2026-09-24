import type { ConfidenceLevel, Gender, SpouseKind, ValidationStatus } from "@prisma/client";

export function genderLabel(gender: Gender): string {
  switch (gender) {
    case "FEMALE":
      return "Féminin";
    case "MALE":
      return "Masculin";
    default:
      return "Non précisé";
  }
}

export function spouseKindLabel(kind: SpouseKind): string {
  switch (kind) {
    case "MARRIAGE":
      return "Mariage";
    case "UNION":
      return "Union";
    default:
      return "Autre";
  }
}

export function confidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case "LOW":
      return "Faible";
    case "MEDIUM":
      return "Moyenne";
    case "HIGH":
      return "Élevée";
    case "VERY_HIGH":
      return "Très élevée";
  }
}

export function validationLabel(status: ValidationStatus): string {
  switch (status) {
    case "DRAFT":
      return "Brouillon";
    case "SUBMITTED":
      return "Soumis";
    case "UNDER_REVIEW":
      return "En revue";
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Rejeté";
    case "PUBLISHED":
      return "Publié";
  }
}
