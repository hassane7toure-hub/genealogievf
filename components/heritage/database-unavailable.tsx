import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database } from "lucide-react";

export function DatabaseUnavailable() {
  return (
    <Alert>
      <Database />
      <AlertTitle>Base généalogique indisponible</AlertTitle>
      <AlertDescription>
        Ajoutez une <code>DATABASE_URL</code> Neon ou PostgreSQL dans <code>.env.local</code>, puis exécutez{" "}
        <code>npx prisma db push</code> et <code>npm run db:seed</code>.
      </AlertDescription>
    </Alert>
  );
}
