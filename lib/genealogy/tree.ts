import type { ConfidentialityLevel, FamilyBranch, Gender, ParentRole, Person } from "@prisma/client";
import { personLifeSpan, personTreeName } from "@/lib/genealogy/format";

type PersonForTree = Person & {
  familyBranch: FamilyBranch | null;
  parentLinks: { parentId: string; childId: string }[];
  childLinks: { parentId: string; childId: string; parentRole?: ParentRole }[];
  spouseLinksAsA: { personIdA: string; personIdB: string }[];
  spouseLinksAsB: { personIdA: string; personIdB: string }[];
};

export type TreeSpouse = { id: string; displayName: string };

export type TreeNode = {
  id: string;
  displayName: string;
  otherNames: string | null;
  lifeSpan: string;
  gender: Gender;
  branchName: string | null;
  confidentialityLevel: ConfidentialityLevel;
  isLineageRoot: boolean;
  hiddenDescendantCount: number;
  motherId: string | null;
  motherName: string | null;
  spouses: TreeSpouse[];
  children: TreeNode[];
};

const CONFIDENTIALITY_ORDER: Record<ConfidentialityLevel, number> = {
  C0: 0,
  C1: 1,
  C2: 2,
  C3: 3,
};

function childrenByParentMap(people: PersonForTree[]) {
  const childrenByParent = new Map<string, string[]>();

  for (const person of people) {
    for (const link of person.parentLinks) {
      const list = childrenByParent.get(link.parentId) ?? [];
      if (!list.includes(link.childId)) {
        list.push(link.childId);
      }
      childrenByParent.set(link.parentId, list);
    }
  }

  return childrenByParent;
}

export function findPaternalApex(people: PersonForTree[], startId: string): string {
  const byId = new Map(people.map((person) => [person.id, person]));
  let currentId = startId;
  const seen = new Set<string>();

  while (byId.has(currentId) && !seen.has(currentId)) {
    seen.add(currentId);
    const person = byId.get(currentId);
    const fatherLink = person?.childLinks.find((link) => link.parentRole === "FATHER") ?? person?.childLinks[0];
    if (!fatherLink || !byId.has(fatherLink.parentId)) {
      return currentId;
    }
    currentId = fatherLink.parentId;
  }

  return startId;
}

export function buildDescendantTree(
  people: PersonForTree[],
  rootId: string,
  lineageRootId?: string,
): TreeNode | null {
  const byId = new Map(people.map((person) => [person.id, person]));
  const childrenByParent = childrenByParentMap(people);
  const officialRoot = lineageRootId ?? rootId;

  const walk = (id: string, ancestry: Set<string>): TreeNode | null => {
    const person = byId.get(id);
    if (!person) return null;
    if (ancestry.has(id)) return null;

    const nextAncestry = new Set(ancestry);
    nextAncestry.add(id);

    const spouseIds = [
      ...person.spouseLinksAsA.map((link) => link.personIdB),
      ...person.spouseLinksAsB.map((link) => link.personIdA),
    ];

    const motherLink = person.childLinks.find((link) => link.parentRole === "MOTHER");
    const mother = motherLink ? byId.get(motherLink.parentId) : undefined;

    const childIds = childrenByParent.get(id) ?? [];
    const children = childIds
      .map((childId) => walk(childId, nextAncestry))
      .filter((node): node is TreeNode => Boolean(node))
      .sort((a, b) => {
        if (a.id === "person-almamy-samory-toure") return -1;
        if (b.id === "person-almamy-samory-toure") return 1;
        const rank = CONFIDENTIALITY_ORDER[a.confidentialityLevel] - CONFIDENTIALITY_ORDER[b.confidentialityLevel];
        if (rank !== 0) return rank;
        return a.id.localeCompare(b.id, "en", { numeric: true });
      });

    return {
      id: person.id,
      displayName: personTreeName(person),
      otherNames: person.otherNames,
      lifeSpan: personLifeSpan(person),
      gender: person.gender,
      branchName: person.familyBranch?.name ?? null,
      confidentialityLevel: person.confidentialityLevel,
      isLineageRoot: person.id === officialRoot,
      hiddenDescendantCount: childIds.filter((childId) => !byId.has(childId)).length,
      motherId: mother?.id ?? null,
      motherName: mother ? personTreeName(mother) : null,
      spouses: spouseIds
        .map((spouseId) => byId.get(spouseId))
        .filter((spouse): spouse is PersonForTree => Boolean(spouse))
        .map((spouse) => ({ id: spouse.id, displayName: personTreeName(spouse) })),
      children,
    };
  };

  return walk(rootId, new Set());
}

export function unattachedPeople(people: PersonForTree[], treeRootId: string | null): PersonForTree[] {
  if (!treeRootId) return people;
  const attached = new Set<string>();
  const childrenByParent = childrenByParentMap(people);
  const byId = new Map(people.map((person) => [person.id, person]));

  const stack = [treeRootId];
  while (stack.length > 0) {
    const id = stack.pop();
    if (!id || attached.has(id)) continue;
    attached.add(id);
    const person = byId.get(id);
    if (person) {
      for (const link of [...person.spouseLinksAsA, ...person.spouseLinksAsB]) {
        attached.add(link.personIdA);
        attached.add(link.personIdB);
      }
    }
    for (const childId of childrenByParent.get(id) ?? []) {
      stack.push(childId);
    }
  }

  return people.filter((person) => !attached.has(person.id));
}
