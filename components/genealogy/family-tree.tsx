"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Minus, Plus, RotateCcw } from "lucide-react";
import type { TreeNode } from "@/lib/genealogy/tree";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FAMILY_CHILD_PREVIEW = 0;

export function FamilyTreeCanvas({
  root,
  selectedId,
  personBasePath,
}: {
  root: TreeNode;
  selectedId?: string;
  personBasePath: string;
}) {
  const [scale, setScale] = useState(0.85);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const stats = useMemo(() => countNodes(root), [root]);

  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {stats} personne{stats > 1 ? "s" : ""} dans l&apos;arbre visible. Glisser pour déplacer, boutons pour zoomer.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => setScale((value) => Math.max(0.4, value - 0.1))} aria-label="Zoom arrière">
            <Minus />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => setScale((value) => Math.min(1.6, value + 0.1))} aria-label="Zoom avant">
            <Plus />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setScale(0.85);
              setOffset({ x: 0, y: 0 });
            }}
            aria-label="Réinitialiser"
          >
            <RotateCcw />
          </Button>
        </div>
      </div>
      <div
        className="min-h-[560px] cursor-grab overflow-auto bg-[radial-gradient(circle_at_top,oklch(0.96_0.02_85),transparent_42%)] p-8 active:cursor-grabbing"
        onMouseDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
        }}
        onMouseMove={(event) => {
          if (!drag.current) return;
          setOffset({
            x: drag.current.ox + (event.clientX - drag.current.x),
            y: drag.current.oy + (event.clientY - drag.current.y),
          });
        }}
        onMouseUp={() => {
          drag.current = null;
        }}
        onMouseLeave={() => {
          drag.current = null;
        }}
      >
        <div
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          className="origin-top w-max min-w-full transition-transform duration-150"
        >
          <TreeBranch
            node={root}
            selectedId={selectedId}
            personBasePath={personBasePath}
            expanded={expanded}
            onToggle={(id) => setExpanded((current) => ({ ...current, [id]: !current[id] }))}
          />
        </div>
      </div>
    </div>
  );
}

function TreeBranch({
  node,
  selectedId,
  personBasePath,
  expanded,
  onToggle,
}: {
  node: TreeNode;
  selectedId?: string;
  personBasePath: string;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const publicChildren = node.children.filter((child) => child.confidentialityLevel === "C0");
  const familyChildren = node.children.filter((child) => child.confidentialityLevel !== "C0");
  const showFamily = expanded[node.id] ?? FAMILY_CHILD_PREVIEW > 0;
  const visibleFamily = showFamily ? familyChildren : familyChildren.slice(0, FAMILY_CHILD_PREVIEW);
  const visibleChildren = [...publicChildren, ...visibleFamily];

  const documentedBranches = publicChildren.filter(
    (child) => child.children.length > 0 || child.hiddenDescendantCount > 0,
  );

  return (
    <div className="flex flex-col items-center">
      <Couple node={node} selectedId={selectedId} personBasePath={personBasePath} />
      {node.children.length > 0 || node.hiddenDescendantCount > 0 ? (
        <>
          <div className="h-8 w-px bg-primary/30" />
          {publicChildren.length === 1 && familyChildren.length === 0 ? (
            <TreeBranch
              node={publicChildren[0]}
              selectedId={selectedId}
              personBasePath={personBasePath}
              expanded={expanded}
              onToggle={onToggle}
            />
          ) : (
            <div className="flex w-full min-w-[56rem] flex-col items-center">
              {visibleChildren.length > 0 ? (
                <Generation
                  childrenNodes={visibleChildren}
                  selectedId={selectedId}
                  personBasePath={personBasePath}
                />
              ) : null}
              {documentedBranches.map((child) => (
                <ChildLineage
                  key={`branch-${child.id}`}
                  node={child}
                  selectedId={selectedId}
                  personBasePath={personBasePath}
                  expanded={expanded}
                  onToggle={onToggle}
                />
              ))}
              {familyChildren.length > 0 ? (
                <FamilyDescendants
                  node={node}
                  familyChildren={familyChildren}
                  showFamily={showFamily}
                  selectedId={selectedId}
                  personBasePath={personBasePath}
                  onToggle={onToggle}
                />
              ) : null}
              {node.hiddenDescendantCount > 0 && familyChildren.length === 0 && documentedBranches.length === 0 ? (
                <p className="mt-5 max-w-md text-center text-sm text-muted-foreground">
                  {node.hiddenDescendantCount} descendant{node.hiddenDescendantCount > 1 ? "s" : ""} documenté
                  {node.hiddenDescendantCount > 1 ? "s" : ""} dans l&apos;espace famille (connexion requise).
                </p>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function ChildLineage({
  node,
  selectedId,
  personBasePath,
  expanded,
  onToggle,
}: {
  node: TreeNode;
  selectedId?: string;
  personBasePath: string;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const sons = node.children.filter((child) => child.gender === "MALE");
  const daughters = node.children.filter((child) => child.gender === "FEMALE");
  const others = node.children.filter((child) => child.gender !== "MALE" && child.gender !== "FEMALE");
  const showFamily = expanded[node.id] ?? true;
  const familyChildren = node.children.filter((child) => child.confidentialityLevel !== "C0");
  const publicChildren = node.children.filter((child) => child.confidentialityLevel === "C0");
  const visibleChildren = showFamily ? node.children : publicChildren;
  const motherGroups = groupChildrenByMother(node, visibleChildren);

  return (
    <section className="mt-10 w-full max-w-6xl rounded-2xl bg-background/70 px-6 py-6 ring-1 ring-foreground/10">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Branche documentée</p>
        <h2 className="mt-1 font-heading text-2xl">Descendance de {node.displayName}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {sons.length} fils, {daughters.length} fille{daughters.length > 1 ? "s" : ""}
          {node.spouses.length > 0 ? `, ${node.spouses.length} épouse${node.spouses.length > 1 ? "s" : ""}` : ""}.
          {others.length > 0 ? ` ${others.length} fiche${others.length > 1 ? "s" : ""} sans sexe précisé.` : null}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Les conjoints des descendants ne figurent pas dans les listes Sanankoro ; seules les
          épouses de Samory (historiographie et prénoms composés) sont renseignées ici.
        </p>
      </div>
      {publicChildren.length === 0 && familyChildren.length > 0 && !showFamily ? (
        <FamilyDescendants
          node={node}
          familyChildren={familyChildren}
          showFamily={showFamily}
          selectedId={selectedId}
          personBasePath={personBasePath}
          onToggle={onToggle}
          sons={sons.filter((child) => child.confidentialityLevel !== "C0")}
          daughters={daughters.filter((child) => child.confidentialityLevel !== "C0")}
          others={others.filter((child) => child.confidentialityLevel !== "C0")}
        />
      ) : null}
      {motherGroups.map((group) => (
        <div key={group.motherId ?? "unknown-mother"} className="mt-8 border-t border-foreground/10 pt-6">
          <div className="mb-4 flex flex-col items-center gap-3">
            {group.spouse ? (
              <Couple
                node={{
                  id: group.spouse.id,
                  displayName: group.motherName,
                  otherNames: null,
                  lifeSpan: "Épouse de Samory",
                  gender: "FEMALE",
                  branchName: null,
                  confidentialityLevel: "C0",
                  isLineageRoot: false,
                  hiddenDescendantCount: 0,
                  motherId: null,
                  motherName: null,
                  spouses: [],
                  children: [],
                }}
                selectedId={selectedId}
                personBasePath={personBasePath}
              />
            ) : (
              <p className="font-heading text-lg">{group.motherName}</p>
            )}
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {group.children.length} enfant{group.children.length > 1 ? "s" : ""}
            </p>
          </div>
          <GroupedGeneration
            sons={group.children.filter((child) => child.gender === "MALE")}
            daughters={group.children.filter((child) => child.gender === "FEMALE")}
            others={group.children.filter((child) => child.gender !== "MALE" && child.gender !== "FEMALE")}
            selectedId={selectedId}
            personBasePath={personBasePath}
          />
        </div>
      ))}
      {node.hiddenDescendantCount > 0 && visibleChildren.length === 0 ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Connectez-vous à l&apos;espace famille pour parcourir ces descendants.
        </p>
      ) : null}
    </section>
  );
}

const HISTORICAL_MOTHER_ORDER = [
  "person-samory-epouse-saranke",
  "person-samory-epouse-diaoulen",
];

function groupChildrenByMother(parent: TreeNode, children: TreeNode[]) {
  const byMother = new Map<string, TreeNode[]>();
  const unknown: TreeNode[] = [];

  for (const child of children) {
    if (child.motherId) {
      const list = byMother.get(child.motherId) ?? [];
      list.push(child);
      byMother.set(child.motherId, list);
    } else {
      unknown.push(child);
    }
  }

  const spouseById = new Map(parent.spouses.map((spouse) => [spouse.id, spouse]));
  const remaining = [...byMother.keys()].filter((id) => !HISTORICAL_MOTHER_ORDER.includes(id));
  remaining.sort((left, right) => {
    const count = (byMother.get(right)?.length ?? 0) - (byMother.get(left)?.length ?? 0);
    if (count !== 0) return count;
    const leftName = spouseById.get(left)?.displayName ?? byMother.get(left)?.[0]?.motherName ?? left;
    const rightName = spouseById.get(right)?.displayName ?? byMother.get(right)?.[0]?.motherName ?? right;
    return leftName.localeCompare(rightName, "fr");
  });

  const groups: {
    motherId: string | null;
    motherName: string;
    spouse: (typeof parent.spouses)[number] | null;
    children: TreeNode[];
  }[] = [...HISTORICAL_MOTHER_ORDER.filter((id) => byMother.has(id)), ...remaining].map((motherId) => {
    const groupChildren = byMother.get(motherId) ?? [];
    const spouse = spouseById.get(motherId) ?? null;
    return {
      motherId,
      motherName: spouse?.displayName ?? groupChildren[0]?.motherName ?? "Épouse",
      spouse,
      children: groupChildren,
    };
  });

  if (unknown.length > 0) {
    groups.push({
      motherId: null,
      motherName: "Mère non documentée",
      spouse: null,
      children: unknown,
    });
  }

  return groups;
}

function FamilyDescendants({
  node,
  familyChildren,
  showFamily,
  selectedId,
  personBasePath,
  onToggle,
  sons,
  daughters,
  others,
}: {
  node: TreeNode;
  familyChildren: TreeNode[];
  showFamily: boolean;
  selectedId?: string;
  personBasePath: string;
  onToggle: (id: string) => void;
  sons?: TreeNode[];
  daughters?: TreeNode[];
  others?: TreeNode[];
}) {
  return (
    <div className="mt-5 flex flex-col items-center">
      <Button
        type="button"
        variant="outline"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => onToggle(node.id)}
      >
        <ChevronDown className={cn("size-4 transition-transform", showFamily && "rotate-180")} />
        {showFamily
          ? "Replier cette descendance"
          : `Afficher ${familyChildren.length} descendant${familyChildren.length > 1 ? "s" : ""} documenté${familyChildren.length > 1 ? "s" : ""}`}
      </Button>
      {showFamily ? (
        <GroupedGeneration
          sons={sons ?? familyChildren.filter((child) => child.gender === "MALE")}
          daughters={daughters ?? familyChildren.filter((child) => child.gender === "FEMALE")}
          others={others ?? familyChildren.filter((child) => child.gender !== "MALE" && child.gender !== "FEMALE")}
          selectedId={selectedId}
          personBasePath={personBasePath}
        />
      ) : null}
    </div>
  );
}

function GroupedGeneration({
  sons,
  daughters,
  others,
  selectedId,
  personBasePath,
}: {
  sons: TreeNode[];
  daughters: TreeNode[];
  others: TreeNode[];
  selectedId?: string;
  personBasePath: string;
}) {
  return (
    <div className="mt-6 grid w-full gap-8">
      {sons.length > 0 ? (
        <div>
          <p className="mb-3 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Fils ({sons.length})
          </p>
          <Generation childrenNodes={sons} selectedId={selectedId} personBasePath={personBasePath} />
        </div>
      ) : null}
      {daughters.length > 0 ? (
        <div>
          <p className="mb-3 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Filles ({daughters.length})
          </p>
          <Generation childrenNodes={daughters} selectedId={selectedId} personBasePath={personBasePath} />
        </div>
      ) : null}
      {others.length > 0 ? (
        <Generation childrenNodes={others} selectedId={selectedId} personBasePath={personBasePath} />
      ) : null}
    </div>
  );
}

function Generation({
  childrenNodes,
  selectedId,
  personBasePath,
}: {
  childrenNodes: TreeNode[];
  selectedId?: string;
  personBasePath: string;
}) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="h-px w-[min(100%,72rem)] bg-primary/25" />
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {childrenNodes.map((child) => (
          <div key={child.id} className="flex flex-col items-center">
            <div className="mb-3 h-6 w-px bg-primary/30" />
            <Couple node={child} selectedId={selectedId} personBasePath={personBasePath} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Couple({
  node,
  selectedId,
  personBasePath,
}: {
  node: TreeNode;
  selectedId?: string;
  personBasePath: string;
}) {
  const inlineSpouses = node.spouses.length <= 2 ? node.spouses : [];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-stretch justify-center gap-2">
        <PersonNode
          node={node}
          selected={node.id === selectedId || node.isLineageRoot}
          href={`${personBasePath}/${node.id}`}
        />
        {inlineSpouses.map((spouse) => (
          <PersonNode
            key={spouse.id}
            node={{
              ...node,
              id: spouse.id,
              displayName: spouse.displayName,
              otherNames: null,
              lifeSpan: "Conjoint(e)",
              isLineageRoot: false,
              hiddenDescendantCount: 0,
              motherId: null,
              motherName: null,
              spouses: [],
              children: [],
            }}
            selected={spouse.id === selectedId}
            href={`${personBasePath}/${spouse.id}`}
            spouse
          />
        ))}
      </div>
      {node.spouses.length > 2 ? (
        <p className="max-w-xs text-center text-[11px] text-primary">
          {node.spouses.length} épouses documentées — détail dans la descendance
        </p>
      ) : null}
    </div>
  );
}

function PersonNode({
  node,
  selected,
  href,
  spouse = false,
}: {
  node: TreeNode;
  selected: boolean;
  href: string;
  spouse?: boolean;
}) {
  return (
    <Link
      href={href}
      onMouseDown={(event) => event.stopPropagation()}
      className={cn(
        "w-44 rounded-xl bg-background px-3 py-3 text-center shadow-sm ring-1 ring-foreground/10 transition-all hover:ring-primary/40",
        selected && "ring-2 ring-primary",
        node.isLineageRoot && "bg-primary/5",
        spouse && "w-40 ring-dashed",
      )}
    >
      {node.isLineageRoot ? (
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-primary">Racine de la lignée</p>
      ) : null}
      <p className="font-heading text-base leading-tight">{node.displayName}</p>
      {node.otherNames ? <p className="mt-1 text-[11px] text-muted-foreground">{node.otherNames}</p> : null}
      <p className="mt-1 text-xs text-muted-foreground">{node.lifeSpan === "Dates non documentées" ? "—" : node.lifeSpan}</p>
      {node.hiddenDescendantCount > 0 ? (
        <p className="mt-2 text-[11px] text-primary">
          {node.hiddenDescendantCount > 1
            ? `${node.hiddenDescendantCount} descendants documentés`
            : "1 descendant documenté"}
        </p>
      ) : null}
    </Link>
  );
}

function countNodes(node: TreeNode): number {
  const spouseCount = node.spouses.length;
  return 1 + spouseCount + node.children.reduce((total, child) => total + countNodes(child), 0);
}
