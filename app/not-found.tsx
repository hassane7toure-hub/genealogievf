import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center px-4 py-16">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">404</p>
        <h1 className="mt-3 font-heading text-4xl">Page introuvable</h1>
        <p className="mt-3 text-muted-foreground">
          Cette ressource n&apos;existe pas, ou elle n&apos;est pas visible à votre niveau de confidentialité.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </main>
      <SiteFooter />
    </>
  );
}
