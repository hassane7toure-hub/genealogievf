"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/histoire", label: "Histoire" },
  { href: "/genealogie", label: "Généalogie" },
  { href: "/arbre", label: "Arbre" },
  { href: "/recherche", label: "Recherche" },
];

export function PublicMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-11 shrink-0 lg:hidden")}
        aria-label="Ouvrir le menu"
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100%,20rem)]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-1 px-4 md:hidden" aria-label="Navigation publique">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-2 p-4">
          <Show when="signed-in">
            <Button asChild className="w-full">
              <Link href="/espace" onClick={() => setOpen(false)}>
                Espace famille
              </Link>
            </Button>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="redirect">
              <Button variant="outline" className="w-full">
                Connexion
              </Button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <Button className="w-full">Rejoindre</Button>
            </SignUpButton>
          </Show>
        </div>
      </SheetContent>
    </Sheet>
  );
}
