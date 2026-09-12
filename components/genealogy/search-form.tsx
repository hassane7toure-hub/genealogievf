import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm({ action, defaultQuery }: { action: string; defaultQuery?: string }) {
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <Input
        name="q"
        defaultValue={defaultQuery}
        placeholder="Nom, prénom, branche, ville..."
        aria-label="Recherche généalogique"
      />
      <Button type="submit">
        <Search />
        Rechercher
      </Button>
    </form>
  );
}
