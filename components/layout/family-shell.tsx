import { UserButton } from "@clerk/nextjs";
import type { User } from "@prisma/client";
import { HeritageLogo } from "@/components/brand/heritage-logo";
import { FamilyNavLinks } from "@/components/layout/family-nav";
import { genealogicalStatusLabel, maxConfidentialityFor, roleLabel, type Actor } from "@/lib/authorization";
import { Badge } from "@/components/ui/badge";

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
      <div className="mx-auto flex w-full max-w-7xl gap-0 lg:gap-8 lg:px-6 lg:py-8">
        <aside className="hidden w-60 shrink-0 lg:block xl:w-64">
          <div className="sticky top-8 rounded-2xl bg-card/90 p-5 ring-1 ring-foreground/10 backdrop-blur-sm">
            <HeritageLogo href="/" size="md" subtitle="Espace famille" />
            <FamilyNavLinks variant="sidebar" />
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
          <div className="sticky top-0 z-30 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-3 px-3 py-2">
              <HeritageLogo href="/espace" size="sm" subtitle="Espace famille" className="min-w-0 flex-1" />
              <UserButton />
            </div>
            <FamilyNavLinks variant="scroll" />
          </div>
          <div className="px-4 py-6 pb-10 sm:px-6 lg:px-0 lg:py-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
