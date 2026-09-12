import type { ConfidentialityLevel, FamilyBranch, Person } from "@prisma/client";
import { personDisplayName, personLifeSpan } from "@/lib/genealogy/format";

type PersonForTree = Person & {
  familyBranch: FamilyBranch | null;
  parentLinks: { parentId: string; childId: string }[];
  childLinks: { parentId: string; childId: string }[];
  spouseLinksAsA: { personIdA: string; personIdB: string }[];
  spouseLinksAsB: { personIdA: string; personIdB: string }[];
};

export type TreeNode = {
  id: string;
  displayName: string;
  lifeSpan: string;
  branchName: string | null;
  confidentialityLevel: ConfidentialityLevel;
  spouses: { id: string; displayName: string }[];
  children: TreeNode[];
};

export function buildDescendantTree(people: PersonForTree[], rootId: string): TreeNode | null {
  const byId = new Map(people.map((person) => [person.id, person]));
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

    const children = (childrenByParent.get(id) ?? [])
      .map((childId) => walk(childId, nextAncestry))
      .filter((node): node is TreeNode => Boolean(node));

    return {
      id: person.id,
      displayName: personDisplayName(person),
      lifeSpan: personLifeSpan(person),
      branchName: person.familyBranch?.name ?? null,
      confidentialityLevel: person.confidentialityLevel,
      spouses: spouseIds
        .map((spouseId) => byId.get(spouseId))
        .filter((spouse): spouse is PersonForTree => Boolean(spouse))
        .map((spouse) => ({ id: spouse.id, displayName: personDisplayName(spouse) })),
      children,
    };
  };

  return walk(rootId, new Set());
}

export function unattachedPeople(people: PersonForTree[], treeRootId: string | null): PersonForTree[] {
  if (!treeRootId) return people;
  const attached = new Set<string>();
  const childrenByParent = new Map<string, string[]>();

  for (const person of people) {
    for (const link of person.parentLinks) {
      const list = childrenByParent.get(link.parentId) ?? [];
      list.push(link.childId);
      childrenByParent.set(link.parentId, list);
    }
  }

  const stack = [treeRootId];
  while (stack.length > 0) {
    const id = stack.pop();
    if (!id || attached.has(id)) continue;
    attached.add(id);
    for (const childId of childrenByParent.get(id) ?? []) {
      stack.push(childId);
    }
  }

  return people.filter((person) => !attached.has(person.id));
}
