import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied } from "@/components/family/access-denied";
import { MarkReadButton } from "@/components/family/mark-read-button";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { EmptyState } from "@/components/heritage/empty-state";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/lib/auth";
import { canAccessFamilyLife } from "@/lib/authorization";
import { formatFamilyDate } from "@/lib/family/labels";
import { listNotifications } from "@/lib/family/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const actor = await getActor();
  if (!canAccessFamilyLife(actor)) {
    return <AccessDenied title="Notifications" description="Réservées aux membres reconnus de la Grande Famille (C1)." />;
  }

  const { value: notifications, unavailable } = await loadGenealogy(() => listNotifications(actor), []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl">Notifications</h1>
          <p className="mt-2 text-muted-foreground">Réunions, discussions et alertes de la Grande Famille.</p>
        </div>
        <MarkReadButton />
      </div>
      {unavailable ? <DatabaseUnavailable /> : null}
      {!unavailable && notifications.length === 0 ? (
        <EmptyState title="Aucune notification" description="Les annonces familiales apparaîtront ici." />
      ) : (
        <div className="grid gap-3">
          {notifications.map((item) => {
            const inner = (
              <Card className={item.readAt ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>
                    {formatFamilyDate(item.createdAt)}
                    {item.body ? ` · ${item.body}` : ""}
                    {item.readAt ? " · lu" : " · non lu"}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
            return item.href ? (
              <Link key={item.id} href={item.href}>{inner}</Link>
            ) : (
              <div key={item.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
