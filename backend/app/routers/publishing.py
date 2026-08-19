# includes strict pre-publish checks, status updates, and deterministic sorting

import json
import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_admin
from ..models import PublishRunModel, ShowModel

router = APIRouter(prefix="/admin", tags=["Publishing"])



@router.get("/validation-report")
def get_validation_report(
    admin_role: str = Depends(require_admin),
):
    report_path = os.getenv(
        "VALIDATION_REPORT_PATH",
        "storage_data/validation_report.json",
    )

    if not os.path.exists(report_path):
        return {
            "message": "No validation failures logged.",
            "errors": [],
        }

    try:
        with open(report_path, "r", encoding="utf-8") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=500,
            detail="Validation report could not be read.",
        ) from exc

    

@router.post("/catalog/publish")
def publish_catalog(admin_role: str = Depends(require_admin), db: Session = Depends(get_db)):
    """
    Protected by require_admin. Validates rules, updates status, 
    atomically builds catalog.json, and logs the run.
    """
    try:
        # 1. Fetch all draft/unpublished shows and episodes
        shows = db.query(ShowModel).all()
        
        catalogue_sections = {}
        total_published_episodes = 0
        pre_publish_errors = []

        for show in shows:
            # Rule: A published show must have a section
            if not show.section:
                pre_publish_errors.append(f"Show '{show.show_title}' cannot be published because it lacks a section assignment.")
                continue

            section = show.section
            if section not in catalogue_sections:
                catalogue_sections[section] = []

            content_group_map = {}
            valid_shows_episodes = 0

            for season in show.seasons:
                for ep in season.episodes:
                    # Rule: An episode can't be published without artwork and a duration
                    has_artwork = len(ep.artworks) > 0
                    has_duration = ep.duration_seconds is not None and ep.duration_seconds > 0

                    if not has_artwork or not has_duration:
                        pre_publish_errors.append(
                            f"Episode '{ep.episode_title}' (ID: {ep.episode_id}) blocked from publishing: "
                            f"{'Missing artwork. ' if not has_artwork else ''}"
                            f"{'Missing duration.' if not has_duration else ''}"
                        )
                        continue

                    cg = ep.content_group
                    if cg not in content_group_map:
                        content_group_map[cg] = {
                            "episode_id": ep.episode_id,
                            "show_title": show.show_title,
                            "episode_title": ep.episode_title,
                            "slug": ep.slug,
                            "synopsis": ep.synopsis,
                            "season_number": season.season_number,
                            "episode_number": ep.episode_number,
                            "duration_seconds": ep.duration_seconds,
                            "content_group": cg,
                            "languages": [],
                            "artwork": [art.file_path for art in ep.artworks]
                        }
                    
                    if ep.language not in content_group_map[cg]["languages"]:
                        content_group_map[cg]["languages"].append(ep.language)
                    
                    # Mark episode as published in DB
                    ep.status = "published"
                    valid_shows_episodes += 1
                    total_published_episodes += 1

            if content_group_map:
                show_entry = {
                    "show_title": show.show_title,
                    "categories": show.categories or [],
                    "episodes": list(content_group_map.values())
                }
                catalogue_sections[section].append(show_entry)
                show.is_published = True

        # If there are blocking validation errors, abort publishing and report back
        if pre_publish_errors and total_published_episodes == 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Publishing aborted due to data quality violations.",
                    "errors": pre_publish_errors
                }
            )

        db.commit()

        # Sort sections and shows deterministically for clean structure
        sorted_sections = {
            sec: sorted(shows_list, key=lambda s: s["show_title"])
            for sec, shows_list in sorted(catalogue_sections.items())
        }

        catalogue_data = {
            "generated_at": datetime.utcnow().isoformat(),
            "sections": sorted_sections
        }

        # 2. Atomic Write (Write to .tmp first, then replace)
        target_path = os.getenv(
            "CATALOGUE_PATH",
            "storage_data/catalogue.json"
        )
        temp_path = target_path + ".tmp"
        os.makedirs(os.path.dirname(target_path), exist_ok=True)

        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(catalogue_data, f, indent=4)
        
        os.replace(temp_path, target_path) # Atomic switch—readers never see half-written files

        # 3. Record the Publish Run in Database
        publish_run = PublishRunModel(
            triggered_by="admin",
            successful_count=total_published_episodes,
            failed_count=len(pre_publish_errors),
            outcome="SUCCESS"
        )
        db.add(publish_run)
        db.commit()

        return {
            "message": "Catalogue published successfully by admin!",
            "timestamp": catalogue_data["generated_at"],
            "published_episodes_count": total_published_episodes,
            "warnings": pre_publish_errors if pre_publish_errors else None
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Publishing failed due to server error: {e!s}")