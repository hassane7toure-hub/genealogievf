"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trees, Users, Search, LayoutDashboard, BookOpen, CalendarDays, Calendar, MessagesSquare, Wallet, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/espace", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/espace/personnes", label: "Personnes", icon: Users },
  { href: "/espace/arbre", label: "Arbre", icon: Trees },
  { href: "/espace/reunions", label: "Réunions", icon: CalendarDays },
  { href: "/espace/evenements", label: "Événements", icon: Calendar },
  { href: "/espace/discussions", label: "Discussions", icon: MessagesSquare },
  { href: "/espace/caisse", label: "Caisse", icon: Wallet },
  { href: "/espace/notifications", label: "Notifications", icon: Bell },
  { href: "/espace/recherche", label: "Recherche", icon: Search },
  { href: "/histoire", label: "Site public", icon: BookOpen },
];

function isActive(href: string, pathname: string) {
  if (href === "/espace") return pathname === "/espace";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function FamilyNavLinks({ variant }: { variant: "sidebar" | "scroll" }) {
  const pathname = usePathname();

  if (variant === "scroll") {
    return (
      <nav className="flex gap-2 overflow-x-auto px-3 pb-3" aria-label="Espace authentifié">
        {links.map((link) => {
          const active = isActive(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="mt-6 grid gap-1" aria-label="Espace authentifié">
      {links.map((link) => {
        const active = isActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm transition-colors",
              active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
