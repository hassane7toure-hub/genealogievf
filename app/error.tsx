"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col items-start justify-center px-4 py-16">
      <h1 className="font-heading text-4xl">Une erreur est survenue</h1>
      <p className="mt-3 text-muted-foreground">
        Réessayez, ou revenez à l&apos;accueil. Si le problème persiste, vérifiez la configuration Clerk et Neon.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <Button variant="outline" asChild>
          <Link href="/">Accueil</Link>
        </Button>
      </div>
    </main>
  );
}
