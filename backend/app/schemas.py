import re

from pydantic import BaseModel, Field, field_validator

# Allowed reference lists (you can expand these based on your reference.json docs)
ALLOWED_LANGUAGES = {"English", "Hindi"}  # Example allowed languages
ALLOWED_SECTIONS = {"Trending", "Popular", "New Releases", "Kids"} # Example sections

class EpisodeSeedValidator(BaseModel):
    episode_id: str
    show_title: str
    slug: str
    section: str
    categories: list[str]
    synopsis: str | None = None
    season_number: int = Field(..., ge=1) # Must be >= 1
    episode_number: int = Field(..., ge=1) # Must be >= 1
    episode_title: str
    duration_seconds: int = Field(..., gt=0)
    language: str
    content_group: str
    status: str
    artwork_available: list[str]

    # 1. Check if artwork array is empty or missing
    @field_validator("artwork_available")
    @classmethod
    def validate_artwork(cls, v):
        if not v or len(v) == 0:
            raise ValueError("Invalid record: 'artwork_available' array is empty or missing zero artwork.")
        return v

    # 2. Check language restriction (negate unallowed third languages)
    @field_validator("language")
    @classmethod
    def validate_language(cls, v):
        if v not in ALLOWED_LANGUAGES:
            raise ValueError(f"Invalid language '{v}'. Must be one of allowed languages: {ALLOWED_LANGUAGES}")
        return v

    # 3. Check content_group pattern: slug_s(2 digit season)e(2 digit episode)
    @field_validator("content_group")
    @classmethod
    def validate_content_group(cls, v, info):
        # Pattern: anything followed by _sXXeXX (e.g., show-name_s01e05)
        pattern = r"^.+_s\d{2}e\d{2}$"
        if not re.match(pattern, v):
            raise ValueError(f"Invalid content_group format '{v}'. Must match pattern like 'slug_s01e01'.")
        return v

    # 4. Check sections against reference list
    @field_validator("section")
    @classmethod
    def validate_section(cls, v):
        if v not in ALLOWED_SECTIONS:
            raise ValueError(f"Section '{v}' does not match official reference sections.")
        return v