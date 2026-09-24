import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { HeritageLogo } from "@/components/brand/heritage-logo";
import { PublicMobileNav } from "@/components/layout/public-mobile-nav";
import { Button } from "@/components/ui/button";

const publicLinks = [
  { href: "/histoire", label: "Histoire" },
  { href: "/genealogie", label: "Généalogie" },
  { href: "/arbre", label: "Arbre" },
  { href: "/recherche", label: "Recherche" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <HeritageLogo href="/" size="sm" priority className="min-w-0 sm:hidden" />
        <HeritageLogo href="/" size="md" priority className="hidden min-w-0 sm:flex" />
        <nav className="hidden min-w-0 items-center gap-4 text-sm md:flex lg:gap-6" aria-label="Navigation publique">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <Show when="signed-out">
              <SignInButton mode="redirect">
                <Button variant="ghost">Connexion</Button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <Button>Rejoindre</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button variant="outline" asChild>
                <Link href="/espace">Espace famille</Link>
              </Button>
            </Show>
          </div>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <PublicMobileNav />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <HeritageLogo href="/" size="sm" />
        <p>Les informations publiques (C0) n&apos;exigent pas de compte.</p>
      </div>
    </footer>
  );
}
