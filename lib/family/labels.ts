import type {
  DiscussionStatus,
  FamilyEventKind,
  MeetingStatus,
  PaymentStatus,
  VoteChoice,
} from "@prisma/client";

export function meetingStatusLabel(status: MeetingStatus): string {
  switch (status) {
    case "UPCOMING":
      return "À venir";
    case "COMPLETED":
      return "Tenue";
    case "CANCELLED":
      return "Annulée";
  }
}

export function eventKindLabel(kind: FamilyEventKind): string {
  switch (kind) {
    case "FAMILY_MEETING":
      return "Réunion familiale";
    case "WEDDING":
      return "Mariage";
    case "BAPTISM":
      return "Baptême";
    case "FUNERAL":
      return "Funérailles";
    case "CULTURAL":
      return "Événement culturel";
    case "HERITAGE":
      return "Patrimoine";
    case "ANNIVERSARY":
      return "Anniversaire";
    default:
      return "Autre";
  }
}

export function discussionStatusLabel(status: DiscussionStatus): string {
  switch (status) {
    case "OPEN":
      return "Ouverte";
    case "CLOSED":
      return "Clôturée";
    case "ARCHIVED":
      return "Archivée";
  }
}

export function voteChoiceLabel(choice: VoteChoice): string {
  switch (choice) {
    case "FOR":
      return "Pour";
    case "AGAINST":
      return "Contre";
    case "ABSTAIN":
      return "Abstention";
  }
}

export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "PAID":
      return "Payé";
    case "LATE":
      return "En retard";
    case "CANCELLED":
      return "Annulé";
  }
}

export function formatFamilyDate(value: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);
}

export function formatFamilyDay(value: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(value);
}

export function formatMoney(amount: { toString(): string }, currency: string): string {
  const numeric = Number(amount.toString());
  const value = Number.isFinite(numeric) ? numeric : 0;
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} ${currency}`;
}
