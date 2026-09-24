import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import type { User } from "@prisma/client";
import { Trees, Users, Search, LayoutDashboard, BookOpen, CalendarDays, Calendar, MessagesSquare, Wallet, Bell } from "lucide-react";
import { HeritageLogo } from "@/components/brand/heritage-logo";
import { genealogicalStatusLabel, maxConfidentialityFor, roleLabel, type Actor } from "@/lib/authorization";
import { Badge } from "@/components/ui/badge";

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

export function FamilyShell({
  actor,
  user,
  children,
}: {
  actor: Actor;
  user: User | null;
  children: React.ReactNode;
}) {
  const level = maxConfidentialityFor(actor);

  return (
    <div className="min-h-full bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl gap-0 md:gap-8 md:px-6 md:py-8">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-8 rounded-2xl bg-card/90 p-5 ring-1 ring-foreground/10 backdrop-blur-sm">
            <HeritageLogo href="/" size="md" subtitle="Espace famille" />
            <nav className="mt-6 grid gap-1" aria-label="Espace authentifié">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <link.icon className="size-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 border-t pt-4 text-xs text-muted-foreground">
              {user ? (
                <>
                  <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                  <p className="mt-1">{roleLabel(user.role)}</p>
                  <p>{genealogicalStatusLabel(user.genealogicalStatus)}</p>
                </>
              ) : (
                <p>Compte Clerk connecté. Synchronisation applicative après configuration de la base.</p>
              )}
              <Badge variant="outline" className="mt-2">
                Accès {level}
              </Badge>
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-md md:hidden">
            <HeritageLogo href="/espace" size="sm" subtitle="Espace famille" />
            <UserButton />
          </div>
          <div className="px-4 pb-10 md:px-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
