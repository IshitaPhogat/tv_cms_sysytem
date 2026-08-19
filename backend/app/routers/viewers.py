import json
import os

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(tags=["Viewer"])

CATALOGUE_PATH = os.getenv(
    "CATALOGUE_PATH",
    "storage_data/catalogue.json",
)


def load_catalogue():
    if not os.path.exists(CATALOGUE_PATH):
        raise HTTPException(
            status_code=404,
            detail="Published catalogue is not available yet.",
        )

    try:
        with open(CATALOGUE_PATH, "r", encoding="utf-8") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=500,
            detail="Published catalogue could not be read.",
        ) from exc


@router.get("/catalog")
def get_catalog():
    return load_catalogue()


@router.get("/catalog/search")
def search_catalog(
    q: str | None = Query(
        default=None,
        description="Search show title, episode title, or category",
    ),
    category: str | None = Query(default=None),
    language: str | None = Query(default=None),
    section: str | None = Query(default=None),
):
    catalogue = load_catalogue()

    results = []

    for catalogue_section, shows in catalogue.get("sections", {}).items():

        # Section filter
        if section and section.lower() not in catalogue_section.lower():
            continue

        for show in shows:

            # Category filter
            categories = show.get("categories", [])

            if category and not any(
                category.lower() in str(item).lower()
                for item in categories
            ):
                continue

            for episode in show.get("episodes", []):

                # Language filter
                languages = episode.get("languages", [])

                if language and not any(
                    language.lower() in str(item).lower()
                    for item in languages
                ):
                    continue

                # Search
                if q:
                    search_text = " ".join(
                        [
                            str(show.get("show_title", "")),
                            str(episode.get("episode_title", "")),
                            " ".join(str(item) for item in categories),
                        ]
                    ).lower()

                    if q.lower() not in search_text:
                        continue

                results.append(
                    {
                        "section": catalogue_section,
                        "show_title": show.get("show_title"),
                        "categories": categories,
                        "episode": episode,
                    }
                )

    return {
        "total_matches": len(results),
        "results": results,
    }