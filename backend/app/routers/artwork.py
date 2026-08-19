import json
import os
from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ArtworkModel, EpisodeModel
from ..storage import get_storage_backend

router = APIRouter(prefix="/admin", tags=["Artwork Upload"])

ARTWORK_SPECS = {
    "poster": {
        "target_ratio": 2 / 3,
        "ratio_tolerance": 0.05,
        "min_width": 600,
        "min_height": 900,
        "max_size_kb": 200,
        "recommended_dims": "600x900px or larger"
    },
    "banner": {
        "target_ratio": 16 / 9,
        "ratio_tolerance": 0.05,
        "min_width": 1280,
        "min_height": 720,
        "max_size_kb": 200,
        "recommended_dims": "1280x720px or larger"
    },
    "thumbnail": {
        "target_ratio": 16 / 9,
        "ratio_tolerance": 0.05,
        "min_width": 640,
        "min_height": 360,
        "max_size_kb": 200,
        "recommended_dims": "640x360px or larger"
    }
}

STORAGE_DIR = os.getenv(
    "ARTWORK_STORAGE_DIR",
    "storage_data/artworks"
)

REPORT_PATH = os.getenv(
    "ARTWORK_REPORT_PATH",
    "storage_data/validation_report_artwork.json"
)
os.makedirs(STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)

def update_artwork_report(log_entry: dict):
    """Helper function to read, update, and write the artwork validation report atomically."""
    report = {
        "total_attempts": 0,
        "successful_uploads": 0,
        "failed_uploads": 0,
        "logs": []
    }
    
    if os.path.exists(REPORT_PATH):
        try:
            with open(REPORT_PATH, "r", encoding="utf-8") as f:
                report = json.load(f)
        except json.JSONDecodeError:
            pass # Reset if file is corrupted

    report["total_attempts"] += 1
    if log_entry["status"] == "SUCCESS":
        report["successful_uploads"] += 1
    else:
        report["failed_uploads"] += 1

    report["logs"].append(log_entry)

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=4)


@router.post("/upload-artwork")
async def upload_artwork(
    episode_id: str = Form(...),
    artwork_type: str = Form(...),  # 'poster', 'banner', or 'thumbnail'
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    timestamp = datetime.utcnow().isoformat()
    filename = file.filename if file.filename else "unknown_file"

    # 1. Validate artwork type
    if artwork_type not in ARTWORK_SPECS:
        reason = f"Invalid artwork type '{artwork_type}'. Choose from: {list(ARTWORK_SPECS.keys())}"
        update_artwork_report({
            "timestamp": timestamp,
            "episode_id": episode_id,
            "artwork_type": artwork_type,
            "filename": filename,
            "status": "FAILED",
            "reason": reason
        })
        raise HTTPException(status_code=400, detail=reason)

    spec = ARTWORK_SPECS[artwork_type]

    # 2. Read contents to check file size ceiling (200 KB)
    contents = await file.read()
    file_size_kb = len(contents) / 1024

    if file_size_kb > spec["max_size_kb"]:
        reason = f"Image file is too large ({file_size_kb:.1f} KB). Maximum allowed size for a {artwork_type} is {spec['max_size_kb']} KB."
        update_artwork_report({
            "timestamp": timestamp,
            "episode_id": episode_id,
            "artwork_type": artwork_type,
            "filename": filename,
            "status": "FAILED",
            "file_size_kb": f"{file_size_kb:.1f} KB",
            "reason": reason
        })
        raise HTTPException(status_code=400, detail=reason)

    # 3. Check dimensions & aspect ratio using Pillow
    try:
        image = Image.open(BytesIO(contents))
        width, height = image.size
    except Exception:
        reason = "Uploaded file is not a valid image format."
        update_artwork_report({
            "timestamp": timestamp,
            "episode_id": episode_id,
            "artwork_type": artwork_type,
            "filename": filename,
            "status": "FAILED",
            "reason": reason
        })
        raise HTTPException(status_code=400, detail=reason)

    if width < spec["min_width"] or height < spec["min_height"]:
        reason = (
            f"Image dimensions are too small for {artwork_type}. "
            f"Got {width}x{height}, but minimum required dimensions are "
            f"{spec['min_width']}x{spec['min_height']}."
        )

        update_artwork_report({
            "timestamp": timestamp,
            "episode_id": episode_id,
            "artwork_type": artwork_type,
            "filename": filename,
            "status": "FAILED",
            "dimensions": f"{width}x{height}",
            "reason": reason
        })

        raise HTTPException(status_code=400, detail=reason)

    actual_ratio = width / height
    expected_ratio = spec["target_ratio"]

    if abs(actual_ratio - expected_ratio) > spec["ratio_tolerance"]:
        reason = (
            f"Incorrect aspect ratio for {artwork_type}. "
            f"Got dimensions {width}x{height}, but expected a ratio of {expected_ratio:.2f} "
            f"(Recommended dimensions: {spec['recommended_dims']})."
        )
        update_artwork_report({
            "timestamp": timestamp,
            "episode_id": episode_id,
            "artwork_type": artwork_type,
            "filename": filename,
            "status": "FAILED",
            "dimensions": f"{width}x{height}",
            "reason": reason
        })
        raise HTTPException(status_code=400, detail=reason)

    # 4. Verify episode existence
    # Accept either the public episode ID (e.g. "ep_0001")
    # or the internal numeric database ID.
    episode = db.query(EpisodeModel).filter(
        EpisodeModel.episode_id == episode_id
    ).first()

    if not episode:
        try:
            numeric_id = int(episode_id)
            episode = db.query(EpisodeModel).filter(
                EpisodeModel.id == numeric_id
            ).first()
        except ValueError:
            episode = None

    if not episode:
        reason = f"Associated episode '{episode_id}' not found."

        update_artwork_report({
            "timestamp": timestamp,
            "episode_id": episode_id,
            "artwork_type": artwork_type,
            "filename": filename,
            "status": "FAILED",
            "reason": reason
        })

        raise HTTPException(
            status_code=404,
            detail=reason
        )
    
    # 5. Save via Storage Abstraction & Save metadata to DB
    storage = get_storage_backend()
    
    file_extension = filename.split(".")[-1] if "." in filename else "jpg"
    relative_path = f"artworks/ep_{episode_id}_{artwork_type}.{file_extension}"
    
    saved_location = storage.save(contents, relative_path)

    db_artwork = ArtworkModel(
        episode_id=episode.id,
        artwork_type=artwork_type,
        file_path=saved_location,
        file_size_kb=int(file_size_kb),
        width=width,
        height=height
    )
    db.add(db_artwork)
    db.commit()
    db.refresh(db_artwork)

    # 6. Log successful upload to report
    update_artwork_report({
        "timestamp": timestamp,
        "episode_id": episode_id,
        "artwork_type": artwork_type,
        "filename": filename,
        "status": "SUCCESS",
        "dimensions": f"{width}x{height}",
        "file_size_kb": f"{file_size_kb:.1f} KB"
    })

    return {
        "message": "Artwork uploaded and validated successfully!",
        "artwork_id": db_artwork.id,
        "file_size_kb": f"{file_size_kb:.1f} KB",
        "dimensions": f"{width}x{height}"
    }