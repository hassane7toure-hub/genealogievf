# TOURÉ FAMILY HERITAGE

Plateforme de préservation généalogique, historique et culturelle de la Grande Famille TOURÉ.

Le site public (niveau C0) est consultable sans compte. L’espace famille exige Clerk. L’autorisation applicative (C0–C3) est distincte de l’authentification.

## Démarrage

```bash
npm install
copy .env.example .env.local
```

Renseignez ensuite :

1. Une `DATABASE_URL` Neon / PostgreSQL
2. Les clés Clerk (`pk_test_...` et `sk_test_...`)

```bash
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Ce que couvre cette première version

- Socle Next.js 16, TypeScript, Tailwind, shadcn/ui
- Confidentialité C0–C3 contrôlée côté serveur
- Clerk (connexion / inscription / profil)
- Généalogie : personnes, branches, parents, conjoints, homonymes
- Arbre descendant depuis **Lanfia TOURÉ**
- Tableau de bord authentifié
- Vie de famille (V2) : réunions, événements, discussions/votes, caisse, notifications

Les modules héritage avancé, réunions, cotisations et votes viendront ensuite, sans réécrire le schéma de base.
