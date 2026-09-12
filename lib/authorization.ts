import type {
  AppRole,
  ConfidentialityLevel,
  GenealogicalStatus,
  User,
} from "@prisma/client";

export const CONFIDENTIALITY_RANK: Record<ConfidentialityLevel, number> = {
  C0: 0,
  C1: 1,
  C2: 2,
  C3: 3,
};

export type Actor = {
  isAuthenticated: boolean;
  clerkUserId: string | null;
  user: User | null;
};

export function maxConfidentialityFor(actor: Actor): ConfidentialityLevel {
  if (!actor.isAuthenticated || !actor.user) {
    return "C0";
  }

  const { role, genealogicalStatus } = actor.user;

  if (role === "ADMIN" || role === "COMMITTEE_MEMBER") {
    return "C3";
  }

  if (genealogicalStatus === "DIRECT_DESCENDANT") {
    return "C2";
  }

  if (role === "FAMILY_MEMBER" || genealogicalStatus === "FAMILY_MEMBER") {
    return "C1";
  }

  return "C0";
}

export function canAccessLevel(
  actor: Actor,
  level: ConfidentialityLevel,
): boolean {
  return CONFIDENTIALITY_RANK[maxConfidentialityFor(actor)] >= CONFIDENTIALITY_RANK[level];
}

export function canWriteGenealogy(actor: Actor): boolean {
  const role = actor.user?.role;
  return role === "FAMILY_MEMBER" || role === "COMMITTEE_MEMBER" || role === "ADMIN";
}

export function canManageCommittee(actor: Actor): boolean {
  const role = actor.user?.role;
  return role === "COMMITTEE_MEMBER" || role === "ADMIN";
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "Administration";
    case "COMMITTEE_MEMBER":
      return "Comité restreint";
    case "FAMILY_MEMBER":
      return "Membre de la Grande Famille";
    default:
      return "Invité";
  }
}

export function genealogicalStatusLabel(status: GenealogicalStatus): string {
  switch (status) {
    case "DIRECT_DESCENDANT":
      return "Descendant direct";
    case "FAMILY_MEMBER":
      return "Membre de la lignée";
    default:
      return "Non rattaché";
  }
}

export function confidentialityLabel(level: ConfidentialityLevel): string {
  switch (level) {
    case "C0":
      return "Public";
    case "C1":
      return "Grande Famille";
    case "C2":
      return "Descendants directs";
    case "C3":
      return "Comité restreint";
  }
}

export function guestActor(): Actor {
  return { isAuthenticated: false, clerkUserId: null, user: null };
}
