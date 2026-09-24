import type { Metadata } from "next";
import { AccessDenied } from "@/components/family/access-denied";
import { ContributionForm, ExpenseForm } from "@/components/family/family-forms";
import { DatabaseUnavailable } from "@/components/heritage/database-unavailable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/lib/auth";
import { canManageFinance } from "@/lib/authorization";
import { formatFamilyDay, formatMoney, paymentStatusLabel } from "@/lib/family/labels";
import { listContributions, listExpenses } from "@/lib/family/queries";
import { loadGenealogy } from "@/lib/genealogy/safe";

export const metadata: Metadata = { title: "Caisse" };

export default async function TreasuryPage() {
  const actor = await getActor();
  if (!canManageFinance(actor)) {
    return (
      <AccessDenied
        title="Caisse familiale"
        description="Les cotisations et dépenses sont réservées au comité restreint (C3)."
      />
    );
  }

  const { value, unavailable } = await loadGenealogy(async () => {
    const [contributions, expenses] = await Promise.all([listContributions(actor), listExpenses(actor)]);
    return { contributions, expenses };
  }, { contributions: [], expenses: [] });

  const inflow = value.contributions.reduce((sum, item) => sum + Number(item.amount.toString()), 0);
  const outflow = value.expenses.reduce((sum, item) => sum + Number(item.amount.toString()), 0);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Caisse familiale</h1>
        <p className="mt-2 text-muted-foreground">Cotisations, dépenses et solde. Chaque écriture est auditable.</p>
      </div>
      {unavailable ? <DatabaseUnavailable /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat title="Cotisations" value={formatMoney({ toString: () => String(inflow) }, "GNF")} />
        <Stat title="Dépenses" value={formatMoney({ toString: () => String(outflow) }, "GNF")} />
        <Stat title="Solde" value={formatMoney({ toString: () => String(inflow - outflow) }, "GNF")} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ContributionForm />
        <ExpenseForm />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="grid gap-3">
          <h2 className="font-heading text-2xl">Cotisations</h2>
          {value.contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune cotisation enregistrée.</p>
          ) : (
            value.contributions.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle>{item.contributorName}</CardTitle>
                  <CardDescription>
                    {formatFamilyDay(item.paidAt)} · {paymentStatusLabel(item.status)}
                    {item.purpose ? ` · ${item.purpose}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="font-heading text-lg">{formatMoney(item.amount, item.currency)}</CardContent>
              </Card>
            ))
          )}
        </section>
        <section className="grid gap-3">
          <h2 className="font-heading text-2xl">Dépenses</h2>
          {value.expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune dépense enregistrée.</p>
          ) : (
            value.expenses.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>
                    {formatFamilyDay(item.spentAt)}
                    {item.category ? ` · ${item.category}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="font-heading text-lg">{formatMoney(item.amount, item.currency)}</CardContent>
              </Card>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="font-heading text-2xl">{value}</CardContent>
    </Card>
  );
}
