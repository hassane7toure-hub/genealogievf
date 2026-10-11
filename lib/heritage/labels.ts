import type {
  ConfidenceLevel,
  DecisionKind,
  DocumentKind,
  HeritageTarget,
  SourceType,
  TestimonyStage,
  ValidationStatus,
} from "@prisma/client";

export function sourceTypeLabel(type: SourceType): string {
  switch (type) {
    case "ORAL_TESTIMONY":
      return "Témoignage oral";
    case "FAMILY_ARCHIVE":
      return "Archive familiale";
    case "OFFICIAL_DOCUMENT":
      return "Document officiel";
    case "HISTORICAL_BOOK":
      return "Livre historique";
    case "ACADEMIC_PUBLICATION":
      return "Publication académique";
    case "ADMINISTRATIVE_DOCUMENT":
      return "Document administratif";
    case "PHOTOGRAPH":
      return "Photographie";
    case "FAMILY_WITNESS":
      return "Témoin familial";
    default:
      return "Autre source";
  }
}

export function confidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case "LOW":
      return "Faible";
    case "MEDIUM":
      return "Moyen";
    case "HIGH":
      return "Élevé";
    case "VERY_HIGH":
      return "Très élevé";
  }
}

export function validationStatusLabel(status: ValidationStatus): string {
  switch (status) {
    case "DRAFT":
      return "Brouillon";
    case "SUBMITTED":
      return "Soumis";
    case "UNDER_REVIEW":
      return "En examen";
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Rejeté";
    case "PUBLISHED":
      return "Publié";
  }
}

export function testimonyStageLabel(stage: TestimonyStage): string {
  switch (stage) {
    case "RAW":
      return "Témoignage brut";
    case "TRANSCRIBED":
      return "Transcrit";
    case "REVIEWED":
      return "Relu";
    case "VALIDATED":
      return "Validé";
    case "PUBLISHED":
      return "Publié";
  }
}

export function documentKindLabel(kind: DocumentKind): string {
  switch (kind) {
    case "HISTORICAL":
      return "Document historique";
    case "FAMILY_RECORD":
      return "Archive familiale";
    case "PHOTO":
      return "Photographie";
    case "MANUSCRIPT":
      return "Manuscrit";
    case "ADMINISTRATIVE":
      return "Document administratif";
    case "GENEALOGICAL":
      return "Document généalogique";
    case "BOOK":
      return "Livre";
    case "LETTER":
      return "Lettre";
    case "MAP":
      return "Carte";
    default:
      return "Autre";
  }
}

export function heritageTargetLabel(target: HeritageTarget): string {
  switch (target) {
    case "SOURCE":
      return "Source";
    case "TESTIMONY":
      return "Témoignage";
    case "DOCUMENT":
      return "Document";
  }
}

export function decisionKindLabel(kind: DecisionKind): string {
  switch (kind) {
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Rejeté";
    case "REVISION":
      return "Révision demandée";
  }
}
