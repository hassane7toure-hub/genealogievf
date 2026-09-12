import { isClerkConfigured } from "@/lib/env";
import { requireActor } from "@/lib/auth";
import { FamilyShell } from "@/components/layout/family-shell";
import { SetupBanner } from "@/components/heritage/setup-banner";

export default async function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <h1 className="font-heading text-3xl">Espace famille</h1>
        <p className="mt-3 text-muted-foreground">
          L&apos;espace authentifié s&apos;ouvre après la configuration de Clerk. Le site public reste accessible sans compte.
        </p>
        <div className="mt-6">
          <SetupBanner />
        </div>
      </div>
    );
  }

  const actor = await requireActor();
  return <FamilyShell actor={actor} user={actor.user}>{children}</FamilyShell>;
}
