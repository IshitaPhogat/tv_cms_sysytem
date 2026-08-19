import json
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import EpisodeModel, SeasonModel, ShowModel

router = APIRouter(prefix="/admin", tags=["Seeding & Validation"])


@router.post("/seed-data")
async def seed_and_validate_database(db: Session = Depends(get_db)):
    seed_file_path = os.getenv(
    "SEED_FILE_PATH",
    "backend/seed_shows.json"
    )
    
    if not os.path.exists(seed_file_path):
        seed_file_path = "seed_shows.json"
        if not os.path.exists(seed_file_path):
            raise HTTPException(status_code=404, detail="seed_shows.json file not found in container storage.")

    with open(seed_file_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    report = {
        "total_records_processed": len(raw_data),
        "successful_drafts_created": 0,
        "failed_records": 0,
        "errors": []
    }

    seen_episode_ids = set()
    seen_content_group_languages = set() # Track unique (content_group, language) pairs!

    for index, row in enumerate(raw_data):
        ep_id = row.get("episode_id")
        show_title = row.get("show_title")
        season_num = row.get("season_number")
        lang = row.get("language")
        content_group = row.get("content_group")
        section = row.get("section")

        error_reasons = []

        # 1. Check Episode ID Duplicates
        if ep_id in seen_episode_ids:
            error_reasons.append(f"Duplicate episode ID '{ep_id}' found in dataset.")
        else:
            seen_episode_ids.add(ep_id)

        # 2. Check (content_group, language) Unique Pair Rule
        if content_group and lang:
            pair = (content_group, lang)
            if pair in seen_content_group_languages:
                error_reasons.append(f"Duplicate language variant: Combination of content_group '{content_group}' and language '{lang}' already exists.")
            else:
                seen_content_group_languages.add(pair)


        # If any validation rules failed, log it for the editor validation report
        if error_reasons:
            report["failed_records"] += 1
            report["errors"].append({
                "row_number": index + 1,
                "episode_id": ep_id,
                "show_title": show_title,
                "issue": " | ".join(error_reasons),
                "action_required": "Please fix the data field in the source file or CMS before attempting to publish."
            })
            continue

        # --- SAVE VALID RECORD TO DATABASE (Draft Mode, Proper Hierarchy) ---
        try:
            # Step A: Find or create the Show
            show = db.query(ShowModel).filter(ShowModel.show_title == show_title).first()
            if not show:
                show = ShowModel(
                    show_title=show_title,
                    section=section,
                    categories=row.get("categories", []),
                    is_published=False
                )
                db.add(show)
                db.commit()
                db.refresh(show)

            # Step B: Find or create the Season (Season 0 is reserved for trailers!)
            season = db.query(SeasonModel).filter(
                SeasonModel.show_id == show.id, 
                SeasonModel.season_number == season_num
            ).first()
            
            if not season:
                season_title = "Trailers & Extras" if season_num == 0 else f"Season {season_num}"
                season = SeasonModel(
                    show_id=show.id,
                    season_number=season_num,
                    title=season_title
                )
                db.add(season)
                db.commit()
                db.refresh(season)

            # Step C: Create Episode record
            episode = EpisodeModel(
                episode_id=ep_id,
                season_id=season.id,
                slug=row.get("slug"),
                episode_title=row.get("episode_title"),
                synopsis=row.get("synopsis"),
                episode_number=row.get("episode_number"),
                duration_seconds=row.get("duration_seconds"),
                language=lang,
                content_group=content_group,
                status="draft"
            )
            db.add(episode)
            db.commit()

            report["successful_drafts_created"] += 1

        except Exception as db_ex:
            db.rollback()
            report["failed_records"] += 1
            report["errors"].append({
                "row_number": index + 1,
                "episode_id": ep_id,
                "show_title": show_title,
                "issue": f"Database error during insert: {db_ex!s}",
                "action_required": "Contact technical support or check unique constraints."
            })

    # Save human-readable validation report to storage disk
    report_path = os.getenv(
    "VALIDATION_REPORT_PATH",
    "storage_data/validation_report.json"
    )
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as r_file:
        json.dump(report, r_file, indent=4)

    return {
        "message": "Seed processing completed!",
        "summary": {
            "total_processed": report["total_records_processed"],
            "successful_drafts": report["successful_drafts_created"],
            "failed_records": report["failed_records"]
        },
        "report_saved_at": report_path
    }