"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { TreeNode } from "@/lib/genealogy/tree";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FamilyTreeCanvas({
  root,
  selectedId,
  personBasePath,
}: {
  root: TreeNode;
  selectedId?: string;
  personBasePath: string;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const stats = useMemo(() => countNodes(root), [root]);

  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {stats} personne{stats > 1 ? "s" : ""} visible{stats > 1 ? "s" : ""} depuis la racine. Glisser pour déplacer, boutons pour zoomer.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => setScale((value) => Math.max(0.5, value - 0.1))} aria-label="Zoom arrière">
            <Minus />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => setScale((value) => Math.min(1.8, value + 0.1))} aria-label="Zoom avant">
            <Plus />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setScale(1);
              setOffset({ x: 0, y: 0 });
            }}
            aria-label="Réinitialiser"
          >
            <RotateCcw />
          </Button>
        </div>
      </div>
      <div
        className="min-h-[420px] cursor-grab overflow-auto bg-[radial-gradient(circle_at_top,oklch(0.96_0.02_85),transparent_42%)] p-8 active:cursor-grabbing"
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
          className="origin-top-left transition-transform duration-150"
        >
          <TreeBranch node={root} selectedId={selectedId} personBasePath={personBasePath} />
        </div>
      </div>
    </div>
  );
}

function TreeBranch({
  node,
  selectedId,
  personBasePath,
}: {
  node: TreeNode;
  selectedId?: string;
  personBasePath: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <PersonNode node={node} selected={node.id === selectedId} href={`${personBasePath}/${node.id}`} />
      {node.children.length > 0 ? (
        <div className="mt-8 flex flex-wrap justify-center gap-8 border-t border-dashed pt-8">
          {node.children.map((child) => (
            <TreeBranch key={child.id} node={child} selectedId={selectedId} personBasePath={personBasePath} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PersonNode({ node, selected, href }: { node: TreeNode; selected: boolean; href: string }) {
  return (
    <Link
      href={href}
      onMouseDown={(event) => event.stopPropagation()}
      className={cn(
        "min-w-48 rounded-xl bg-background px-4 py-3 text-center shadow-sm ring-1 ring-foreground/10 transition-all hover:ring-primary/40",
        selected && "ring-2 ring-primary",
      )}
    >
      <p className="font-heading text-lg leading-tight">{node.displayName}</p>
      <p className="mt-1 text-xs text-muted-foreground">{node.lifeSpan}</p>
      {node.spouses.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          conjoint{node.spouses.length > 1 ? "s" : ""} : {node.spouses.map((spouse) => spouse.displayName).join(", ")}
        </p>
      ) : null}
    </Link>
  );
}

function countNodes(node: TreeNode): number {
  return 1 + node.children.reduce((total, child) => total + countNodes(child), 0);
}
