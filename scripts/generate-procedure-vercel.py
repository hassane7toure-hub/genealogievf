"""Génère le guide de publication Vercel au format Word."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

OUT = Path(__file__).resolve().parents[1] / "docs" / "Procedure_publication_Vercel_TOURE_FAMILY_HERITAGE.docx"

UMBER = RGBColor(0x5C, 0x3A, 0x21)
MUTED = RGBColor(0x5A, 0x4A, 0x3A)
BLACK = RGBColor(0x1F, 0x1A, 0x14)


def set_run(run, *, size=11, bold=False, color=BLACK, italic=False):
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = color


def add_para(doc, text, *, size=11, bold=False, italic=False, color=BLACK, space_after=8, align=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    if align:
        p.alignment = align
    run = p.add_run(text)
    set_run(run, size=size, bold=bold, color=color, italic=italic)
    return p


def add_heading_custom(doc, text, level):
    sizes = {1: 20, 2: 15, 3: 12}
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(16 if level == 1 else 12)
    p.paragraph_format.space_after = Pt(8)
    run = p.add_run(text)
    set_run(run, size=sizes[level], bold=True, color=UMBER)
    return p


def add_steps(doc, steps):
    for i, step in enumerate(steps, 1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.5)
        p.paragraph_format.space_after = Pt(6)
        num = p.add_run(f"{i}. ")
        set_run(num, size=11, bold=True, color=UMBER)
        body = p.add_run(step)
        set_run(body, size=11)


def shade_header(cell):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = tcPr.makeelement(qn("w:shd"), {qn("w:fill"): "5C3A21", qn("w:val"): "clear"})
    tcPr.append(shd)


def add_table(doc, headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, header in enumerate(headers):
        cell = table.rows[0].cells[i]
        shade_header(cell)
        cell.text = ""
        p = cell.paragraphs[0]
        run = p.add_run(header)
        set_run(run, size=10, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF))
    for r_idx, row in enumerate(rows, 1):
        for c_idx, value in enumerate(row):
            cell = table.rows[r_idx].cells[c_idx]
            cell.text = ""
            p = cell.paragraphs[0]
            run = p.add_run(value)
            set_run(run, size=10)
    doc.add_paragraph()
    return table


def add_note(doc, title, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.left_indent = Cm(0.3)
    t = p.add_run(f"{title} ")
    set_run(t, size=11, bold=True, color=UMBER)
    b = p.add_run(text)
    set_run(b, size=11, italic=True, color=MUTED)


def build() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Cm(2)
    section.bottom_margin = Cm(2)
    section.left_margin = Cm(2.2)
    section.right_margin = Cm(2.2)

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fr = fp.add_run("TOURÉ FAMILY HERITAGE — Publication Vercel — Document interne")
    set_run(fr, size=8, color=MUTED)

    add_para(doc, "TOURÉ FAMILY HERITAGE", size=12, bold=True, color=UMBER, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_para(
        doc,
        "Procédure de publication du site sur Vercel",
        size=22,
        bold=True,
        color=UMBER,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=8,
    )
    add_para(
        doc,
        "Guide étape par étape pour mettre en ligne l’application Next.js (généalogie, Clerk, base Neon) depuis le tableau de bord Vercel ou le terminal.",
        size=12,
        italic=True,
        color=MUTED,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=16,
    )
    add_para(
        doc,
        f"Version 1.0  ·  {date.today().strftime('%d/%m/%Y')}  ·  Dépôt GitHub https://github.com/hassane7toure-hub/genealogievf",
        size=10,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=18,
    )

    add_heading_custom(doc, "1. Objet du document", 1)
    add_para(
        doc,
        "Ce document décrit, dans l’ordre, comment publier TOURÉ FAMILY HERITAGE sur Vercel pour qu’il soit accessible sur Internet. Il correspond à l’application actuelle : Next.js 16, authentification Clerk, base PostgreSQL Neon, arbre généalogique et espace famille.",
    )
    add_note(
        doc,
        "État actuel :",
        "le projet Vercel alhassane/genealogievf existe déjà. L’URL de production est https://genealogievf.vercel.app. Le tableau de bord est https://vercel.com/alhassane/genealogievf. Ce guide sert à recommencer, à relier GitHub, à ajouter le nom de domaine Hostinger, ou à publier une mise à jour.",
    )
    add_note(
        doc,
        "Important :",
        "GitHub stocke le code, il ne publie pas le site à lui seul. Un hébergement Hostinger PHP (public_html) ou GitHub Pages ne peut pas faire tourner cette application. Vercel compile Next.js et lance le serveur automatiquement.",
    )

    add_heading_custom(doc, "2. Ce qu’il ne faut pas faire", 1)
    add_steps(
        doc,
        [
            "Ne pas copier le dossier du projet dans public_html chez Hostinger : Next.js n’est pas un site HTML statique.",
            "Ne pas utiliser Dokploy / le VPS pour cette procédure : le chemin officiel de ce guide est Vercel.",
            "Ne pas exporter le site en pages statiques : Clerk, Prisma et l’espace famille exigent un serveur.",
            "Ne pas commiter les fichiers .env, .env.local ni les mots de passe : les secrets restent dans Vercel → Settings → Environment Variables.",
            "Ne pas coller les clés secrètes (sk_…, DATABASE_URL) dans un e-mail, un chat ou un document Word partagé.",
            "Ne pas lancer un nouveau déploiement si un build est déjà « Building » : attendez le résultat.",
        ],
    )

    add_heading_custom(doc, "3. Rôles de chaque service", 1)
    add_table(
        doc,
        ["Service", "Rôle", "À garder"],
        [
            ["GitHub", "Code source (dépôt genealogievf)", "Oui"],
            ["Vercel", "Compilation et mise en ligne Next.js", "Oui — hébergeur de l’application"],
            ["Neon", "Base PostgreSQL (personnes, arbre, espace famille)", "Oui — coller DATABASE_URL dans Vercel"],
            ["Clerk", "Connexion / inscription des membres", "Oui — clés + domaines autorisés"],
            ["Hostinger", "Nom de domaine (DNS) seulement", "Oui — pointer vers Vercel, pas vers le VPS"],
            ["Dokploy / VPS", "Ancien essai d’hébergement", "Inutile pour cette procédure"],
        ],
    )

    add_heading_custom(doc, "4. Préparer le code sur GitHub", 1)
    add_para(
        doc,
        "Vercel peut publier depuis GitHub (recommandé pour les mises à jour) ou depuis l’ordinateur avec la commande vercel --prod. Dans les deux cas, le dépôt est : https://github.com/hassane7toure-hub/genealogievf",
    )
    add_steps(
        doc,
        [
            "Ouvrez le projet sur votre ordinateur (Cursor ou l’explorateur de fichiers).",
            "Vérifiez que le site fonctionne en local : npm run dev puis http://localhost:3000.",
            "Vérifiez que le build passe : npm run build. S’il échoue, ne déployez pas.",
            "Ouvrez GitHub Desktop ou le terminal, puis poussez la branche master (ou main) vers GitHub.",
            "Sur github.com/hassane7toure-hub/genealogievf, confirmez que les derniers fichiers (espace famille, conjoints, etc.) sont bien visibles.",
            "Ne poussez jamais .env, .env.local ni les mots de passe.",
        ],
    )
    add_note(
        doc,
        "Branche :",
        "si GitHub est relié à Vercel, chaque push sur master (Production Branch) relance un déploiement. Tous les commits que vous voulez en ligne doivent être sur cette branche.",
    )

    add_heading_custom(doc, "5. Préparer la base Neon", 1)
    add_para(
        doc,
        "La généalogie et l’espace famille sont dans PostgreSQL Neon. Vercel n’héberge pas cette base : le site distant s’y connecte via DATABASE_URL.",
    )
    add_steps(
        doc,
        [
            "Ouvrez https://console.neon.tech et connectez-vous.",
            "Ouvrez le projet de la Grande Famille TOURÉ.",
            "Copiez la chaîne de connexion groupée (pooled), qui commence par postgresql:// et contient sslmode=require.",
            "Gardez-la pour l’étape « Variables d’environnement ». Ne la collez pas dans GitHub.",
            "Dans Vercel, ne cliquez pas sur « Create / Connect Database » (Postgres Vercel ou autre) : ce projet utilise déjà Neon.",
            "Si vous voulez séparer local et production, créez une deuxième base Neon, puis lancez npx prisma db push et npm run db:seed uniquement sur cette base.",
        ],
    )
    add_note(
        doc,
        "Conseil :",
        "pour un premier lancement, réutiliser la base actuelle est plus simple. Passez à une base production dédiée quand le site est stable.",
    )

    add_heading_custom(doc, "6. Préparer Clerk pour le domaine public", 1)
    add_para(
        doc,
        "En local, Clerk utilise souvent des clés de développement (pk_test_ / sk_test_). Sur Internet, il faut autoriser chaque adresse du site. Pour un vrai nom de domaine familial, préférez les clés de production (pk_live_ / sk_live_).",
    )
    add_steps(
        doc,
        [
            "Ouvrez https://dashboard.clerk.com et sélectionnez l’application TOURÉ FAMILY HERITAGE.",
            "Pour un test sur *.vercel.app, l’instance Development et les clés pk_test_ / sk_test_ suffisent, à condition d’ajouter l’URL Vercel dans les domaines.",
            "Pour le site public définitif, passez sur l’instance Production. Dans API Keys, copiez la Publishable Key (pk_live_…) et la Secret Key (sk_live_…).",
            "Dans Configure → Domains, ajoutez https://genealogievf.vercel.app.",
            "Quand le nom de domaine Hostinger sera branché, ajoutez aussi https://votredomaine.com et https://www.votredomaine.com.",
            "Laissez les chemins /sign-in et /sign-up : ils correspondent déjà à l’application.",
            "Les adresses de redirection après connexion restent /espace.",
        ],
    )
    add_note(
        doc,
        "Sans cette étape :",
        "le site peut s’afficher mais la connexion échoue (Clerk refuse le domaine, ou les clés test bloquent un domaine de production).",
    )

    add_heading_custom(doc, "7. Créer le projet dans le tableau de bord Vercel", 1)
    add_para(
        doc,
        "Chemin recommandé si le projet n’existe pas encore, ou pour relier GitHub. Compte déjà utilisé : hassane7toure-hub (équipe alhassane).",
    )
    add_steps(
        doc,
        [
            "Ouvrez https://vercel.com et connectez-vous avec GitHub (compte hassane7toure-hub).",
            "Cliquez sur Add New… → Project.",
            "Dans Import Git Repository, choisissez hassane7toure-hub/genealogievf. Si le dépôt n’apparaît pas, cliquez sur Adjust GitHub App Permissions et autorisez genealogievf.",
            "Vercel détecte Next.js. Contrôlez les champs du tableau ci-dessous avant de continuer.",
            "N’ajoutez pas de base Vercel. Passez à l’étape 8 pour coller les variables, puis cliquez sur Deploy.",
            "Si le projet alhassane/genealogievf existe déjà, n’en créez pas un second : ouvrez-le et utilisez Deployments → Redeploy, ou Settings → Git pour relier le dépôt.",
        ],
    )
    add_table(
        doc,
        ["Champ Vercel", "Valeur à indiquer"],
        [
            ["Framework Preset", "Next.js (détecté tout seul)"],
            ["Root Directory", "vide (le package.json est à la racine)"],
            ["Build Command", "npm run build"],
            ["Output Directory", "laisser le défaut Next.js"],
            ["Install Command", "laisser le défaut (npm install)"],
            ["Node.js Version", "22 (Settings → General si ce n’est pas 22)"],
        ],
    )
    add_note(
        doc,
        "Liaison GitHub :",
        "un premier déploiement a déjà été fait depuis l’ordinateur (CLI). La connexion GitHub automatique a pu échouer. Dans Settings → Git, cliquez sur Connect Git Repository et choisissez genealogievf pour que chaque push republie le site.",
    )

    add_heading_custom(doc, "8. Renseigner les variables d’environnement", 1)
    add_para(
        doc,
        "Dans le projet Vercel : Settings → Environment Variables. Ajoutez-les une par une. Cochez Production, Preview et Development pour chaque ligne. Les clés NEXT_PUBLIC_… doivent être présentes AVANT le build : elles sont inscrites dans le site généré.",
    )
    add_table(
        doc,
        ["Nom de la variable", "Exemple / source", "Obligatoire"],
        [
            ["DATABASE_URL", "Chaîne postgresql://… copiée depuis Neon (pooled, sslmode=require)", "Oui"],
            ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_live_… (ou pk_test_… pour un essai)", "Oui"],
            ["CLERK_SECRET_KEY", "sk_live_… (ou sk_test_…, même instance que la clé publique)", "Oui"],
            ["NEXT_PUBLIC_CLERK_SIGN_IN_URL", "/sign-in", "Oui"],
            ["NEXT_PUBLIC_CLERK_SIGN_UP_URL", "/sign-up", "Oui"],
            ["NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL", "/espace", "Oui"],
            ["NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL", "/espace", "Oui"],
            ["BOOTSTRAP_ADMIN_CLERK_USER_ID", "Identifiant Clerk de l’administrateur (optionnel)", "Non"],
        ],
    )
    add_steps(
        doc,
        [
            "Cliquez sur Add pour chaque ligne du tableau.",
            "Collez les vraies valeurs. Pour le site public définitif, n’utilisez pas pk_test_ / sk_test_.",
            "Enregistrez. Si le site était déjà déployé, allez dans Deployments → … sur le dernier déploiement réussi → Redeploy (cochez « Use existing Build Cache » seulement si les variables NEXT_PUBLIC n’ont pas changé ; sinon décochez pour forcer un nouveau build).",
            "Après un changement de NEXT_PUBLIC_…, un simple Restart ne suffit pas : il faut un nouveau Deploy.",
        ],
    )
    add_note(
        doc,
        "Fichier local :",
        "les mêmes noms existent déjà dans .env.local sur l’ordinateur. Vous pouvez les recopier, mais jamais les envoyer sur GitHub. Vercel a aussi pu ajouter VERCEL_OIDC_TOKEN dans .env.local : ce jeton reste local.",
    )

    add_heading_custom(doc, "9. Lancer le déploiement (tableau de bord)", 1)
    add_steps(
        doc,
        [
            "Vérifiez Framework Next.js, Node 22, commande npm run build et les variables.",
            "Cliquez sur Deploy (premier import) ou Redeploy.",
            "Ouvrez l’onglet Building : les journaux s’affichent en direct.",
            "Attendez le statut Ready (vert). La première fois dure souvent 1 à 3 minutes (npm install, prisma generate, next build).",
            "L’URL de production officielle est https://genealogievf.vercel.app. Une URL de déploiement unique (genealogievf-xxxxx.vercel.app) existe aussi : préférez l’alias officiel.",
            "Si le build échoue, ouvrez le déploiement rouge, lisez le journal en bas, corrigez, puis Redeploy.",
        ],
    )
    add_para(
        doc,
        "Vercel place tout seul les fichiers compilés et démarre Next.js. Vous n’avez pas à lancer npm start ni à ouvrir un port.",
    )

    add_heading_custom(doc, "10. Variante — déployer depuis l’ordinateur (CLI)", 1)
    add_para(
        doc,
        "Utilisez ce chemin si GitHub n’est pas encore relié, ou pour publier le dossier local (y compris des fichiers pas encore poussés).",
    )
    add_steps(
        doc,
        [
            "Installez le CLI une fois : npm install -g vercel",
            "Dans le dossier du projet, connectez-vous : vercel login (choisir GitHub).",
            "Liez le projet existant : vercel link — acceptez l’équipe alhassane et le projet genealogievf. Ne créez pas un deuxième projet.",
            "Les variables doivent déjà être dans Vercel (étape 8). Sinon, ajoutez-les dans le tableau de bord avant de continuer.",
            "Publiez en production : vercel --prod",
            "Attendez Ready. L’URL affichée (Aliased) doit être https://genealogievf.vercel.app",
        ],
    )
    add_note(
        doc,
        "Attention :",
        "vercel --prod envoie le dossier local. Si GitHub n’est pas à jour, le site en ligne peut différer du dépôt. Après un déploiement CLI réussi, poussez le même code sur master pour que tout le monde travaille sur la même version.",
    )

    add_heading_custom(doc, "11. Rendre le site visible sans compte Vercel", 1)
    add_para(
        doc,
        "Par défaut, l’URL *.vercel.app peut demander une connexion Vercel (Deployment Protection). Les visiteurs de la famille n’ont pas ce compte.",
    )
    add_steps(
        doc,
        [
            "Ouvrez le projet → Settings → Deployment Protection.",
            "Pour un site familial public, désactivez Vercel Authentication / SSO sur Production, ou limitez la protection aux Previews seulement.",
            "Enregistrez.",
            "Alternative : reliez un nom de domaine Hostinger (étape 12). Avec le réglage « all except custom domains », le domaine personnalisé est déjà public.",
        ],
    )
    add_note(
        doc,
        "Test interne :",
        "tant que la protection est active, vous pouvez ouvrir le site si vous êtes connecté à Vercel, ou via le bouton Visit du tableau de bord.",
    )

    add_heading_custom(doc, "12. Relier le nom de domaine Hostinger", 1)
    add_para(
        doc,
        "Hostinger sert ici de registrar (nom de domaine), pas d’hébergeur Node. Le trafic doit pointer vers Vercel, plus vers le VPS ni vers Dokploy.",
    )
    add_steps(
        doc,
        [
            "Dans Vercel : Settings → Domains → Add → saisissez votredomaine.com (et www.votredomaine.com si besoin).",
            "Vercel affiche les enregistrements DNS à créer (souvent un A vers 10.0.1.2, et/ou un CNAME www vers cname.vercel-dns.com). Recopiez exactement ce que Vercel indique, les adresses peuvent changer.",
            "Chez Hostinger, ouvrez hPanel → Domaines → DNS / Zone DNS du nom choisi.",
            "Supprimez ou remplacez les anciens A / CNAME qui pointent vers le VPS ou Dokploy, pour éviter un conflit.",
            "Créez les enregistrements demandés par Vercel. Enregistrez.",
            "Attendez la propagation DNS (quelques minutes à quelques heures).",
            "Dans Vercel, le domaine passe à Valid. Le certificat HTTPS (cadenas) est créé automatiquement.",
            "Testez https://www.votredomaine.com et pas seulement http://.",
            "Retournez dans Clerk et ajoutez ce domaine exact (avec et sans www si les deux existent).",
        ],
    )

    add_heading_custom(doc, "13. Vérifier le site en ligne", 1)
    add_para(doc, "Ouvrez le site comme un visiteur, puis comme administrateur.")
    add_steps(
        doc,
        [
            "Accueil : le titre TOURÉ FAMILY HERITAGE et le portrait s’affichent.",
            "Histoire, Généalogie, Arbre, Recherche : pages publiques C0, sans compte.",
            "Bouton Rejoindre / Connexion : le formulaire Clerk s’ouvre (plus d’erreur « Failed to load Clerk JS »).",
            "Après connexion : /espace affiche le tableau de bord, pas une page 404.",
            "Arbre interne : les descendants de Lanfia et de Samory apparaissent.",
            "Fiche d’une personne : les conjoints déjà enregistrés sont listés ; le formulaire « Ajouter un conjoint » est visible pour un compte autorisé à écrire.",
            "Si une page reste blanche, ouvrez le déploiement → Logs (Runtime Logs) dans Vercel.",
        ],
    )
    add_table(
        doc,
        ["Page", "Adresse Vercel", "Adresse une fois le domaine posé"],
        [
            ["Accueil", "https://genealogievf.vercel.app/", "https://votredomaine.com/"],
            ["Histoire", "https://genealogievf.vercel.app/histoire", "https://votredomaine.com/histoire"],
            ["Arbre public", "https://genealogievf.vercel.app/arbre", "https://votredomaine.com/arbre"],
            ["Inscription", "https://genealogievf.vercel.app/sign-up", "https://votredomaine.com/sign-up"],
            ["Espace famille", "https://genealogievf.vercel.app/espace", "https://votredomaine.com/espace"],
        ],
    )

    add_heading_custom(doc, "14. Publier une mise à jour plus tard", 1)
    add_heading_custom(doc, "14.1 Si GitHub est relié à Vercel", 2)
    add_steps(
        doc,
        [
            "Modifiez le site en local, testez avec npm run dev.",
            "Lancez npm run build pour confirmer qu’il n’y a pas d’erreur.",
            "Poussez vers GitHub (branche master).",
            "Vercel reçoit le webhook, installe, compile et publie tout seul.",
            "Suivez l’avancement dans le projet → Deployments.",
            "Si les variables d’environnement changent, enregistrez-les dans Vercel puis Redeploy.",
        ],
    )
    add_heading_custom(doc, "14.2 Si GitHub n’est pas encore relié", 2)
    add_steps(
        doc,
        [
            "Dans le dossier du projet : vercel --prod",
            "Ou, dans le tableau de bord : Deployments → Redeploy (cela republie le dernier envoi, pas vos fichiers locaux non déployés).",
            "Pour relier Git une fois pour toutes : Settings → Git → Connect, ou dans le terminal : vercel git connect.",
        ],
    )

    add_heading_custom(doc, "15. Problèmes fréquents", 1)
    add_table(
        doc,
        ["Symptôme", "Cause probable", "Que faire"],
        [
            [
                "Build échoue : Environment variable not found: DATABASE_URL",
                "DATABASE_URL absente au moment du build",
                "Ajouter la variable (Production + Preview), puis Redeploy sans cache",
            ],
            [
                "Build échoue sur prisma generate",
                "Node trop ancien ou variable manquante",
                "Forcer Node 22 dans Settings → General",
            ],
            [
                "Site Ready mais page Vercel « Authentication Required »",
                "Deployment Protection active sur *.vercel.app",
                "Settings → Deployment Protection, ou ajouter un domaine personnalisé",
            ],
            [
                "Connexion Clerk impossible",
                "Domaine absent dans Clerk, ou clés test / live mélangées",
                "Ajouter l’URL exacte ; utiliser la paire pk_ et sk_ de la même instance",
            ],
            [
                "Arbre vide / base indisponible",
                "Mauvaise DATABASE_URL ou base Neon injoignable",
                "Recopier l’URL Neon pooled, sslmode=require",
            ],
            [
                "Les changements locaux n’apparaissent pas",
                "Vercel publie GitHub, pas le dossier non poussé — ou inverse",
                "git push sur master, ou vercel --prod depuis le bon dossier",
            ],
            [
                "Le dépôt n’apparaît pas à l’import",
                "Application GitHub Vercel mal autorisée",
                "Adjust GitHub App Permissions, puis réimporter",
            ],
            [
                "NEXT_PUBLIC_… ignorées après ajout",
                "Variables ajoutées après le build",
                "Redeploy et décocher le cache de build",
            ],
        ],
    )

    add_heading_custom(doc, "16. Liste de contrôle avant d’annoncer le site", 1)
    add_steps(
        doc,
        [
            "Compte Vercel connecté (hassane7toure-hub / équipe alhassane).",
            "Projet genealogievf ouvert, pas un doublon.",
            "Code à jour poussé sur GitHub (ou dernier vercel --prod à jour).",
            "npm run build réussi en local.",
            "DATABASE_URL Neon renseignée dans Vercel.",
            "Clés Clerk cohérentes + https://genealogievf.vercel.app autorisé (puis le domaine Hostinger).",
            "Déploiement Vercel Ready (vert).",
            "La page d’accueil s’ouvre sans exiger un compte Vercel (protection réglée ou domaine posé).",
            "HTTPS actif.",
            "Accueil, arbre public et connexion testés.",
            "Un compte administrateur peut ouvrir /espace.",
            "Aucune clé secrète n’est visible dans le dépôt GitHub.",
        ],
    )

    add_para(
        doc,
        "Document interne — TOURÉ FAMILY HERITAGE. La publication n’autorise pas à inventer des liens généalogiques ni à fusionner des homonymes.",
        italic=True,
        color=MUTED,
        space_after=0,
    )

    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    build()
