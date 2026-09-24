"use client";

import { useTransition } from "react";
import { markNotificationsReadAction } from "@/lib/family/actions";
import { Button } from "@/components/ui/button";

export function MarkReadButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => start(async () => markNotificationsReadAction())}
    >
      {pending ? "Mise à jour…" : "Tout marquer comme lu"}
    </Button>
  );
}
