import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AccessDenied({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Demandez au comité de valider votre appartenance à la Grande Famille. L&apos;autorisation est
        vérifiée côté serveur, pas seulement dans le menu.
      </CardContent>
    </Card>
  );
}
