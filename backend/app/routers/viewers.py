from fastapi import APIRouter, Depends, Query
from sqlalchemy import String
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import EpisodeModel, SeasonModel, ShowModel

router = APIRouter(tags=["Viewer"])

@router.get("/catalog/search")
def search_catalog(
    q: str = Query(None, description="Search keyword for show title, episode title, or category"),
    category: str = Query(None),
    language: str = Query(None),
    section: str = Query(None),
    db: Session = Depends(get_db)
):
    # Base query joining Episodes -> Seasons -> Shows properly
    query = db.query(EpisodeModel).join(EpisodeModel.season).join(SeasonModel.show)

    # 1. Compose Section Filter
    if section:
        query = query.filter(ShowModel.section.ilike(f"%{section}%"))

    # 2. Compose Language Filter
    if language:
        query = query.filter(EpisodeModel.language.ilike(f"%{language}%"))

    # 3. Compose Category Filter (categories is a JSON array in ShowModel)
    if category:
        query = query.filter(ShowModel.categories.contains([category]))

    # 4. Compose Keyword Search 'q' (matches show title OR episode title OR category)
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            (ShowModel.show_title.ilike(search_term)) |
            (EpisodeModel.episode_title.ilike(search_term)) |
            (ShowModel.categories.cast(String).ilike(search_term))
        )

    results = query.all()
    return {"total_matches": len(results), "results": results}