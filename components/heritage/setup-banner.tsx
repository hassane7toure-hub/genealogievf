import { AlertTriangle, Database, KeyRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isClerkConfigured, isDatabaseConfigured } from "@/lib/env";

export function SetupBanner() {
  const clerk = isClerkConfigured();
  const database = isDatabaseConfigured();
  if (clerk && database) return null;

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <AlertTriangle />
      <AlertTitle>Configuration encore incomplète</AlertTitle>
      <AlertDescription>
        <p className="mt-1">
          Copiez <code className="rounded bg-muted px-1">.env.example</code> vers{" "}
          <code className="rounded bg-muted px-1">.env.local</code>, puis renseignez les clés.
        </p>
        <ul className="mt-2 grid gap-1">
          {!clerk ? (
            <li className="flex items-center gap-2">
              <KeyRound className="size-3.5" /> Clerk n&apos;est pas configuré (authentification).
            </li>
          ) : null}
          {!database ? (
            <li className="flex items-center gap-2">
              <Database className="size-3.5" /> PostgreSQL / Neon n&apos;est pas configuré (généalogie).
            </li>
          ) : null}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
