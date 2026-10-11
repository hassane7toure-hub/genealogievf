"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/espace/heritage", label: "Sources" },
  { href: "/espace/heritage/temoignages", label: "Témoignages" },
  { href: "/espace/heritage/documents", label: "Documents" },
  { href: "/espace/heritage/validation", label: "Validation" },
];

export function HeritageSubnav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto" aria-label="Héritage">
      {links.map((link) => {
        const active = link.href === "/espace/heritage" ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm",
              active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
