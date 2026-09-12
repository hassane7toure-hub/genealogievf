"""One-shot extractor: Excel cahier -> prisma/data/premiere-genealogie.json"""

from __future__ import annotations

import json
import re
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
                "confidentialityLevel": "C0" if source_id == "SRC-001" else "C1",
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
                "officiel de la généalogie suivie par la plateforme. Les listes SRC-002 et "
                "SRC-003 le nomment comme père des personnes y transcrites ; ces rattachements "
                "restent à valider par le comité familial."
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
                "explicitement à Lanfia TOURE (père) et Mâ Sokona (mère). Ce chaînage reste "
                "soumis à la validation du comité familial."
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
                "confidentialityLevel": "C1",
                "confidenceLevel": "MEDIUM",
            },
            {
                "id": "src-003",
                "title": "SRC-003 — Sanankoro, descendance de Kemo Lanfia, filles",
                "type": "FAMILY_ARCHIVE",
                "description": "49 entrées ; numérotation source irrégulière (n°25 dupliqué, n°45 absent).",
                "author": None,
                "confidentialityLevel": "C1",
                "confidenceLevel": "MEDIUM",
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
            "Les 139 personnes SRC-002/SRC-003 sont liées à Lanfia uniquement parce que le catalogue le mentionne comme père selon la source.",
        ],
    }

    # Source-stated children of Kemo Lanfia (not invented: written on sheet 05).
    for person in people:
        if person.get("relationFromSource") == "Enfant de Kemo Lanfia (selon source)":
            role = "FATHER"
            payload["parentLinks"].append(
                {
                    "id": f"rel-{person['provisionalId'].lower()}-lanfia",
                    "parentId": "person-lanfia-toure",
                    "childId": person["id"],
                    "parentRole": role,
                    "notes": (
                        f"{person['provisionalId']} {person['sourceId']} n°{person['sourceNo']} — "
                        "Enfant de Kemo Lanfia (selon source). À valider. Homonymes non fusionnés."
                    ),
                }
            )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")
    print("people", len(payload["people"]))
    print("parentLinks", len(payload["parentLinks"]))
    print("sources", len(payload["sources"]))


if __name__ == "__main__":
    main()
