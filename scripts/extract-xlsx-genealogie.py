"""One-shot extractor: Excel cahier -> prisma/data/premiere-genealogie.json"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import openpyxl

XLSX = Path(
    r"c:\Users\hassa\OneDrive\Desktop\PROJETS\Projet2\asset"
    r"\TOURE_FAMILY_HERITAGE_Cahier_de_charge_et_Donnees_genealogiques.xlsx"
)
OUT = Path(__file__).resolve().parents[1] / "prisma" / "data" / "premiere-genealogie.json"

ZW = re.compile(r"[\u200b\u200c\u200d\ufeff]")


def clean(value: object | None) -> str | None:
    if value is None:
        return None
    text = ZW.sub("", str(value)).strip()
    return text or None


def split_name(full: str) -> tuple[str, str]:
    parts = full.split()
    if len(parts) == 1:
        return parts[0], parts[0]
    last = parts[-1]
    if last.upper() in {"TOURE", "TOURÉ", "CAMARA"}:
        return " ".join(parts[:-1]), last
    return " ".join(parts[:-1]), last


def gender_from(sex: str | None, first_name: str) -> str:
    if sex == "Fils":
        return "MALE"
    if sex == "Fille":
        return "FEMALE"
    if first_name.upper().startswith("MÂ") or first_name.upper().startswith("MA "):
        return "FEMALE"
    return "UNKNOWN"


def fold_name(value: str) -> str:
    stripped = "".join(
        char for char in unicodedata.normalize("NFKD", value) if not unicodedata.combining(char)
    )
    return stripped.casefold().replace("’", "'").strip()


def slugify(value: str) -> str:
    folded = fold_name(value)
    return re.sub(r"[^a-z0-9]+", "-", folded).strip("-")


# Prénoms composés mandingues : [mère] [nom de l'enfant]. Listes Sanankoro, à valider.
# Alias : graphies voisines rattachées à une même épouse.
MOTHER_PREFIXES = [
    "Sininkoro Fatouma",
    "Fatoumatagbé",
    "Djimalassaran",
    "Masséfarima",
    "Kalafatouma",
    "Samanténin",
    "Linkossaran",
    "Fabalasséré",
    "Flassaran",
    "Flasaran",
    "Massitan",
    "Assiatou",
    "Managbé",
    "Diaoulen",
    "Saranké",
    "Kariata",
    "Tiranké",
    "Mamien",
    "Moyima",
    "Ramata",
    "Bintou",
    "Fatoumata",
    "Fatouma",
    "Bagbé",
    "Souaré",
    "Mossoken",
    "Séouka",
    "Mafila",
    "Sonafin",
    "Massé",
    "Assa",
    "Séré",
    "Sogbé",
    "Kanty",
    "Minata",
    "Sama",
    "Sao",
    "Malon",
    "Mamignin",
    "Diongbé",
    "Makoura",
    "Mariama",
    "Kadinta",
    "Sikasso",
    "Hawa",
]

PREFIX_CANONICAL = {
    "Flasaran": "Flassaran",
}

HISTORICAL_WIVES = {
    "Saranké": {
        "firstName": "Saranké",
        "lastName": "Konaté",
        "otherNames": "Saranken Konate, Saranken Konaté",
        "confidenceLevel": "MEDIUM",
        "occupation": "Épouse de l'Almamy, régente selon l'historiographie",
        "biography": (
            "Épouse documentée de l'Almamy Samory TOURÉ (Saranken Konaté), mentionnée dans "
            "l'historiographie comme régente. Les enfants dont le prénom composé commence par "
            "Saranké lui sont rattachés selon la convention mandingue (mère + nom de l'enfant). "
            "Ne pas confondre avec le fils Saranké Mory TOURE. À valider."
        ),
    },
    "Diaoulen": {
        "firstName": "Diaoulen",
        "lastName": "Sidibé",
        "otherNames": "Djaoulén Sidibé, Djaoulén, Djaoulén-Karamo (mère)",
        "confidenceLevel": "MEDIUM",
        "occupation": "Épouse de l'Almamy",
        "biography": (
            "Mère de Diaoulen Karamoko (Djaoulé Karamo / Djaoulé Kramo) selon l'historiographie "
            "(notamment Ibrahima Khalil Fofana). Épouse de Samory. Les enfants « Diaoulen … » "
            "lui sont rattachés par le prénom composé. À valider."
        ),
    },
}

SKIP_MOTHER_PREFIXES = {"el", "hadji", "mâ", "ma"}


def match_mother_prefix(first_name: str) -> str | None:
    folded = fold_name(first_name)
    first_token = folded.split()[0] if folded else ""
    if first_token in SKIP_MOTHER_PREFIXES:
        return None
    ranked = sorted(MOTHER_PREFIXES, key=lambda prefix: len(fold_name(prefix)), reverse=True)
    for prefix in ranked:
        prefix_fold = fold_name(prefix)
        if folded == prefix_fold:
            return None
        if folded.startswith(prefix_fold + " "):
            return PREFIX_CANONICAL.get(prefix, prefix)
    return None


def attach_samory_spouses(payload: dict) -> None:
    children = [
        person
        for person in payload["people"]
        if person.get("sourceId") in {"SRC-002", "SRC-003"}
    ]
    wives: dict[str, dict] = {}
    mother_links: list[dict] = []

    for child in children:
        prefix = match_mother_prefix(child["firstName"])
        if not prefix:
            continue
        wife_id = f"person-samory-epouse-{slugify(prefix)}"
        historical = HISTORICAL_WIVES.get(prefix)
        if wife_id not in wives:
            wives[wife_id] = {
                "id": wife_id,
                "provisionalId": f"PER-SAMORY-EPOUSE-{slugify(prefix).upper()}",
                "firstName": historical["firstName"] if historical else prefix,
                "lastName": historical["lastName"] if historical else "",
                "otherNames": historical["otherNames"] if historical else None,
                "gender": "FEMALE",
                "sourceId": "src-anthroponymie-samory",
                "sourceNo": None,
                "group": "Épouses de Samory",
                "relationFromSource": f"Épouse déduite des prénoms composés commençant par « {prefix} »",
                "validationStatus": "SUBMITTED",
                "confidenceLevel": historical["confidenceLevel"] if historical else "LOW",
                "confidentialityLevel": "C0",
                "occupation": historical.get("occupation") if historical else "Épouse de l'Almamy Samory TOURÉ",
                "biography": historical["biography"] if historical else (
                    f"Épouse de l'Almamy Samory TOURÉ reconstituée à partir des prénoms composés "
                    f"des listes Sanankoro (préfixe « {prefix} » = nom de la mère). "
                    "Patronyme non indiqué dans SRC-002/SRC-003. À valider par le comité. "
                    "Aucun conjoint des descendants n'est transcrit dans ces listes."
                ),
                "observation": "Relation déduite, non écrite comme « épouse » dans le cahier Excel.",
            }
        mother_links.append(
            {
                "id": f"rel-{child['provisionalId'].lower()}-mere",
                "parentId": wife_id,
                "childId": child["id"],
                "parentRole": "MOTHER",
                "notes": (
                    f"{child['provisionalId']} — mère déduite du prénom composé « {child['firstName']} » "
                    f"(préfixe {prefix}). À valider."
                ),
            }
        )

    payload["people"].extend(wives.values())
    payload["parentLinks"].extend(mother_links)
    for wife in wives.values():
        payload["spouseLinks"].append(
            {
                "personIdA": "person-almamy-samory-toure",
                "personIdB": wife["id"],
                "kind": "UNION",
                "notes": (
                    "Union déduite : épouse de Samory et mère d'enfants des listes Sanankoro. "
                    "À valider. Les conjoints des descendants ne figurent pas dans SRC-002/SRC-003."
                ),
            }
        )


def main() -> None:
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    catalog = wb["05_Descendent_Lanfia_Toure"]
    people: list[dict] = []

    for row in catalog.iter_rows(min_row=2, values_only=True):
        provisional_id, source_id, source_no, name, sex, group, relation, status, confidence, observation = row[:10]
        full_name = clean(name)
        if not full_name:
            continue
        first_name, last_name = split_name(full_name)
        gender = gender_from(clean(sex), first_name)
        if source_id == "SRC-001":
            gender = "MALE"
        observation = clean(observation)
        relation_text = clean(relation)
        group_text = clean(group)
        source_key = clean(source_id)
        source_no_text = clean(source_no)
        biography_parts = [
            f"Transcription {str(provisional_id).strip()} depuis {source_key}, n° source {source_no_text}.",
            f"Groupe : {group_text}." if group_text else None,
            f"Relation selon la source : {relation_text}." if relation_text else None,
            observation,
            "Statut : à valider par le comité familial. Homonymes conservés comme fiches distinctes.",
        ]
        people.append(
            {
                "id": str(provisional_id).strip().lower(),
                "provisionalId": str(provisional_id).strip(),
                "firstName": first_name,
                "lastName": last_name,
                "otherNames": None,
                "gender": gender,
                "sourceId": source_key,
                "sourceNo": source_no_text,
                "group": group_text,
                "relationFromSource": relation_text,
                "validationStatus": "SUBMITTED",
                "confidenceLevel": "HIGH" if clean(confidence) and "élev" in (clean(confidence) or "").lower() else "MEDIUM",
                "confidentialityLevel": "C0",
                "biography": " ".join(part for part in biography_parts if part),
                "observation": observation,
            }
        )

    extras = [
        {
            "id": "person-lanfia-toure",
            "provisionalId": "PER-LANFIA",
            "firstName": "Lanfia",
            "lastName": "TOURÉ",
            "otherNames": "Kemo Lanfia TOURÉ, Komo Lanfia TOURE",
            "gender": "MALE",
            "sourceId": "SRC-001",
            "sourceNo": None,
            "group": "Ascendance et relations explicites",
            "relationFromSource": "Ancêtre de référence ; père de l'Almamy Samory TOURE",
            "validationStatus": "PUBLISHED",
            "confidenceLevel": "MEDIUM",
            "confidentialityLevel": "C0",
            "isRoot": True,
            "occupation": "Ancêtre fondateur de la lignée suivie",
            "biography": (
                    "Lanfia TOURÉ (aussi transcrit Kemo / Komo Lanfia) est le point de départ "
                    "officiel de la généalogie suivie par la plateforme. Ses enfants de la liste "
                    "principale SRC-001 sont rattachés ici. Seul Samory dispose, à ce jour, d'un "
                    "corpus de descendants (listes Sanankoro SRC-002 et SRC-003)."
            ),
            "observation": None,
        },
        {
            "id": "person-ma-sokona",
            "provisionalId": "PER-MA-SOKONA",
            "firstName": "Mâ",
            "lastName": "Sokona",
            "otherNames": None,
            "gender": "FEMALE",
            "sourceId": "SRC-001",
            "sourceNo": None,
            "group": "Relations explicites",
            "relationFromSource": "Mère de l'Almamy Samory TOURE",
            "validationStatus": "SUBMITTED",
            "confidenceLevel": "MEDIUM",
            "confidentialityLevel": "C0",
            "biography": (
                "Mère de l'Almamy Samory TOURE selon SRC-001. Ne pas fusionner avec "
                "Mâ Sokonassé ni avec Mâ Sokonossé TOURE sans validation du comité."
            ),
            "observation": "Variante possible avec Mâ Sokonassé : ne pas fusionner.",
        },
        {
            "id": "person-samorigbe",
            "provisionalId": "PER-SAMORIGBE",
            "firstName": "Samorigbé",
            "lastName": "TOURÉ",
            "otherNames": "Samorigbé",
            "gender": "MALE",
            "sourceId": "SRC-001",
            "sourceNo": None,
            "group": "Relations explicites",
            "relationFromSource": "Père de Lanfia TOURE",
            "validationStatus": "SUBMITTED",
            "confidenceLevel": "MEDIUM",
            "confidentialityLevel": "C0",
            "biography": "Père de Lanfia TOURE selon SRC-001. Sexe interprété via la mention « Père de Samorigbé : Lankafia TOURE ».",
            "observation": "Sexe non indiqué sur la ligne des parents de Lanfia ; interprété ensuite comme père.",
        },
        {
            "id": "person-ma-dianka",
            "provisionalId": "PER-MA-DIANKA",
            "firstName": "Mâ",
            "lastName": "Dianka",
            "otherNames": None,
            "gender": "FEMALE",
            "sourceId": "SRC-001",
            "sourceNo": None,
            "group": "Relations explicites",
            "relationFromSource": "Mère de Lanfia TOURE",
            "validationStatus": "SUBMITTED",
            "confidenceLevel": "MEDIUM",
            "confidentialityLevel": "C0",
            "biography": "Mère de Lanfia TOURE selon SRC-001. Sexe interprété à partir du titre « Mâ ».",
            "observation": None,
        },
        {
            "id": "person-lankafia-toure",
            "provisionalId": "PER-LANKAFIA",
            "firstName": "Lankafia",
            "lastName": "TOURE",
            "otherNames": None,
            "gender": "MALE",
            "sourceId": "SRC-001",
            "sourceNo": None,
            "group": "Relations explicites",
            "relationFromSource": "Père de Samorigbé",
            "validationStatus": "SUBMITTED",
            "confidenceLevel": "LOW",
            "confidentialityLevel": "C0",
            "biography": (
                "Père de Samorigbé selon SRC-001. Orthographe à comparer avec « Lanfia » : "
                "les deux fiches restent distinctes tant que le comité n'a pas tranché."
            ),
            "observation": "Ne pas fusionner avec Lanfia TOURÉ.",
        },
        {
            "id": "person-ma-sokonasse",
            "provisionalId": "PER-MA-SOKONASSE",
            "firstName": "Mâ",
            "lastName": "Sokonassé",
            "otherNames": None,
            "gender": "FEMALE",
            "sourceId": "SRC-001",
            "sourceNo": None,
            "group": "Relations explicites",
            "relationFromSource": "Enfant de Fabou CAMARA",
            "validationStatus": "SUBMITTED",
            "confidenceLevel": "LOW",
            "confidentialityLevel": "C0",
            "biography": (
                "Mentionnée dans SRC-001 avec pour père Fabou CAMARA. À distinguer de "
                "Mâ Sokona (mère de Samory) et de Mâ Sokonossé TOURE (PER-0114)."
            ),
            "observation": "Ne pas fusionner avec Mâ Sokona.",
        },
        {
            "id": "person-fabou-camara",
            "provisionalId": "PER-FABOU-CAMARA",
            "firstName": "Fabou",
            "lastName": "CAMARA",
            "otherNames": None,
            "gender": "MALE",
            "sourceId": "SRC-001",
            "sourceNo": None,
            "group": "Relations explicites",
            "relationFromSource": "Père de Mâ Sokonassé",
            "validationStatus": "SUBMITTED",
            "confidenceLevel": "MEDIUM",
            "confidentialityLevel": "C0",
            "biography": "Père de Mâ Sokonassé selon SRC-001.",
            "observation": None,
        },
    ]

    # Keep historical Samory dates on the catalog person.
    for person in people:
        if person["id"] == "per-0001":
            person["id"] = "person-almamy-samory-toure"
            person["firstName"] = "Samory"
            person["lastName"] = "TOURÉ"
            person["otherNames"] = "Almamy Samory TOURE"
            person["gender"] = "MALE"
            person["confidentialityLevel"] = "C0"
            person["validationStatus"] = "PUBLISHED"
            person["confidenceLevel"] = "HIGH"
            person["birthDateText"] = "vers 1830"
            person["birthPlace"] = "Manyambaladugu"
            person["deathDateText"] = "1900"
            person["deathPlace"] = "Ndjolé, Gabon"
            person["occupation"] = "Almamy, fondateur de l'État du Wassoulou"
            person["biography"] = (
                "Almamy Samory TOURE est une figure historique documentée. SRC-001 le relie "
                "explicitement à Lanfia TOURE (père) et Mâ Sokona (mère). Les listes Sanankoro "
                "SRC-002 (90 fils) et SRC-003 (49 filles) sont rattachées à sa branche : c'est "
                "le seul enfant de Kemo Lanfia pour lequel un corpus de descendants a été transcrit. "
                "Ses épouses sont reconstituées à partir de l'historiographie (Saranké Konaté, "
                "Diaoulen Sidibé) et des prénoms composés de ses enfants. Les conjoints de ses "
                "descendants ne figurent pas dans le cahier Excel. Chaînage à valider."
            )

    payload = {
        "sources": [
            {
                "id": "src-001",
                "title": "SRC-001 — ArbreGenealogie.jpeg",
                "type": "FAMILY_ARCHIVE",
                "description": "Généalogie Kemo Lanfia Toure ; 23 personnes ; ascendance de Samory ; notes historiques.",
                "author": None,
                "confidentialityLevel": "C0",
                "confidenceLevel": "MEDIUM",
            },
            {
                "id": "src-002",
                "title": "SRC-002 — Sanankoro, descendance de Kemo Lanfia, fils",
                "type": "FAMILY_ARCHIVE",
                "description": "Liste de 90 noms de fils. Transcription à vérifier par le comité familial.",
                "author": None,
                "confidentialityLevel": "C0",
                "confidenceLevel": "MEDIUM",
            },
            {
                "id": "src-003",
                "title": "SRC-003 — Sanankoro, descendance de Kemo Lanfia, filles",
                "type": "FAMILY_ARCHIVE",
                "description": "49 entrées ; numérotation source irrégulière (n°25 dupliqué, n°45 absent).",
                "author": None,
                "confidentialityLevel": "C0",
                "confidenceLevel": "MEDIUM",
            },
            {
                "id": "src-anthroponymie-samory",
                "title": "Épouses de Samory — historiographie et prénoms composés",
                "type": "HISTORICAL_BOOK",
                "description": (
                    "Saranké Konaté et Diaoulen Sidibé sont nommées dans l'historiographie. "
                    "Les autres épouses sont déduites des prénoms composés des listes Sanankoro "
                    "(mère + nom de l'enfant). Les unions des 139 descendants ne sont pas dans le cahier."
                ),
                "author": None,
                "confidentialityLevel": "C0",
                "confidenceLevel": "LOW",
            },
        ],
        "people": extras + people,
        "parentLinks": [
            {
                "id": "rel-001",
                "parentId": "person-lanfia-toure",
                "childId": "person-almamy-samory-toure",
                "parentRole": "FATHER",
                "notes": "REL-001 SRC-001 — Père et mère de l'Almamy Samory TOURE : Mâ Sokona et Lanfia TOURE. À valider.",
            },
            {
                "id": "rel-002",
                "parentId": "person-ma-sokona",
                "childId": "person-almamy-samory-toure",
                "parentRole": "MOTHER",
                "notes": "REL-002 SRC-001 — Relation explicitement indiquée. À valider.",
            },
            {
                "id": "rel-003",
                "parentId": "person-samorigbe",
                "childId": "person-lanfia-toure",
                "parentRole": "FATHER",
                "notes": "REL-003 SRC-001 — Parents de Lanfia : Mâ Dianka et Samorigbé. À valider.",
            },
            {
                "id": "rel-004",
                "parentId": "person-ma-dianka",
                "childId": "person-lanfia-toure",
                "parentRole": "MOTHER",
                "notes": "REL-004 SRC-001 — Sexe interprété à partir du titre « Mâ ». À valider.",
            },
            {
                "id": "rel-005",
                "parentId": "person-lankafia-toure",
                "childId": "person-samorigbe",
                "parentRole": "FATHER",
                "notes": "REL-005 SRC-001 — Ne pas fusionner Lankafia et Lanfia sans validation.",
            },
            {
                "id": "rel-006",
                "parentId": "person-fabou-camara",
                "childId": "person-ma-sokonasse",
                "parentRole": "FATHER",
                "notes": "REL-006 SRC-001 — Vérifier si Mâ Sokonassé et Mâ Sokona sont la même personne.",
            },
        ],
        "spouseLinks": [
            {
                "personIdA": "person-lanfia-toure",
                "personIdB": "person-ma-sokona",
                "kind": "UNION",
                "notes": "Union déduite de REL-001/REL-002 (parents de Samory). À valider.",
            },
            {
                "personIdA": "person-ma-dianka",
                "personIdB": "person-samorigbe",
                "kind": "UNION",
                "notes": "Union déduite de REL-003/REL-004 (parents de Lanfia). À valider.",
            },
        ],
        "qualityNotes": [
            "162 fiches transcrites (23 + 90 + 49). Homonymes conservés comme personnes distinctes.",
            "Lanfia / Lankafia et Mâ Sokona / Mâ Sokonassé / Mâ Sokonossé TOURE restent distincts.",
            "Les 22 autres noms SRC-001 sont rattachés à Lanfia d'après la liste principale « Fils de komo lanfia Toure » (relation déduite, à valider).",
            "Les 139 personnes SRC-002/SRC-003 forment la descendance documentée de Samory (seul enfant de Lanfia pour lequel ces listes existent). À valider.",
            "Épouses de Samory : Saranké Konaté et Diaoulen Sidibé (historiographie) ; autres épouses déduites des préfixes de prénoms composés. À valider.",
            "Aucun conjoint des descendants de Samory n'est transcrit dans SRC-002/SRC-003 ; ces unions restent non documentées.",
        ],
    }

    # SRC-001 liste principale : fils de komo lanfia (sheet 02), sauf Samory déjà en REL-001.
    for person in people:
        if person.get("sourceId") != "SRC-001" or person["id"] == "person-almamy-samory-toure":
            continue
        payload["parentLinks"].append(
            {
                "id": f"rel-{person['provisionalId'].lower()}-lanfia",
                "parentId": "person-lanfia-toure",
                "childId": person["id"],
                "parentRole": "FATHER",
                "notes": (
                    f"{person['provisionalId']} SRC-001 n°{person['sourceNo']} — "
                    "Fils de komo lanfia Toure (relation déduite, liste principale). À valider."
                ),
            }
        )

    # Listes Sanankoro : intitulées Fils/Filles de Samory dans le cahier.
    # Seul enfant de Lanfia pour lequel un corpus de descendants est disponible.
    for person in people:
        if person.get("relationFromSource") == "Enfant de Kemo Lanfia (selon source)":
            payload["parentLinks"].append(
                {
                    "id": f"rel-{person['provisionalId'].lower()}-samory",
                    "parentId": "person-almamy-samory-toure",
                    "childId": person["id"],
                    "parentRole": "FATHER",
                    "notes": (
                        f"{person['provisionalId']} {person['sourceId']} n°{person['sourceNo']} — "
                        "Liste Sanankoro (cahier : Fils/Filles Samory ; titre source : Descendance de Kemo Lanfia). "
                        "Rattachée à Samory, seul enfant de Lanfia dont la descendance est documentée. À valider."
                    ),
                }
            )

    attach_samory_spouses(payload)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")
    print("people", len(payload["people"]))
    print("parentLinks", len(payload["parentLinks"]))
    print("spouseLinks", len(payload["spouseLinks"]))
    print("sources", len(payload["sources"]))


if __name__ == "__main__":
    main()
