from fastapi import APIRouter, Depends, Query
from sqlalchemy import String, or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user_role
from ..models import EpisodeModel, SeasonModel, ShowModel

router = APIRouter(prefix="/admin", tags=["Content Management"])


@router.get("/drafts")
def get_drafts(
    q: str | None = Query(default=None),
    section: str | None = Query(default=None),
    language: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    role: str = Depends(get_current_user_role),
    db: Session = Depends(get_db),
):
    query = (
        db.query(EpisodeModel, ShowModel)
        .join(EpisodeModel.season)
        .join(SeasonModel.show)
    )

    if section:
        query = query.filter(
            ShowModel.section.ilike(f"%{section}%")
        )

    if language:
        query = query.filter(
            EpisodeModel.language.ilike(f"%{language}%")
        )

    if status:
        query = query.filter(
            EpisodeModel.status.ilike(f"%{status}%")
        )

    if q:
        search_term = f"%{q}%"

        query = query.filter(
            or_(
                ShowModel.show_title.ilike(search_term),
                EpisodeModel.episode_title.ilike(search_term),
                ShowModel.categories.cast(String).ilike(search_term),
            )
        )

    total = query.count()

    offset = (page - 1) * page_size

    rows = (
        query
        .order_by(EpisodeModel.episode_id)
        .offset(offset)
        .limit(page_size)
        .all()
    )

    results = []

    for episode, show in rows:
        results.append(
            {
                "episode_id": episode.episode_id,
                "episode_title": episode.episode_title,
                "language": episode.language,
                "status": episode.status or "draft",
                "show_title": show.show_title,
                "section": show.section,
                "categories": show.categories or [],
                "season_number": episode.season.season_number,
                "episode_number": episode.episode_number,
                "duration_seconds": episode.duration_seconds,
                "content_group": episode.content_group,
            }
        )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "results": results,
    }