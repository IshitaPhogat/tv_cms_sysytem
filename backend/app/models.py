import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


class ShowModel(Base):
    __tablename__ = "shows"

    id = Column(Integer, primary_key=True, index=True)
    show_title = Column(String, unique=True, index=True, nullable=False)
    section = Column(String, index=True, nullable=True)
    categories = Column(JSON, nullable=True)  # Array of categories
    is_published = Column(Boolean, default=False)

    # Relationship to seasons
    seasons = relationship("SeasonModel", back_populates="show", cascade="all, delete-orphan")


class SeasonModel(Base):
    __tablename__ = "seasons"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id"), nullable=False)
    season_number = Column(Integer, nullable=False)  # Note: Season 0 is reserved for trailers!
    title = Column(String, nullable=True)

    # Relationships
    show = relationship("ShowModel", back_populates="seasons")
    episodes = relationship("EpisodeModel", back_populates="season", cascade="all, delete-orphan")


class EpisodeModel(Base):
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True, index=True)
    episode_id = Column(String, unique=True, index=True, nullable=False)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    
    slug = Column(String, nullable=False)
    episode_title = Column(String, nullable=False)
    synopsis = Column(Text, nullable=True)
    episode_number = Column(Integer, nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    language = Column(String, index=True, nullable=False)  # e.g., English, Hindi
    content_group = Column(String, index=True, nullable=False) # Links language variants

    __table_args__ = ( UniqueConstraint('content_group', 'language', name='uq_content_group_language'), )

    status = Column(String, nullable=True) # draft, published, etc.

    # Relationships
    season = relationship("SeasonModel", back_populates="episodes")
    artworks = relationship("ArtworkModel", back_populates="episode", cascade="all, delete-orphan")


class ArtworkModel(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, index=True)
    episode_id = Column(Integer, ForeignKey("episodes.id"), nullable=False)
    artwork_type = Column(String, nullable=False)  # poster, banner, thumbnail
    file_path = Column(String, nullable=False)
    file_size_kb = Column(Integer, nullable=False) # Must enforce <= 200 KB
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)

    # __table_args__ = (
    #     UniqueConstraint(
    #         "episode_id",
    #         "artwork_type",
    #         name="uq_episode_artwork_type"
    #     ),
    # )

    episode = relationship("EpisodeModel", back_populates="artworks")


class PublishRunModel(Base):
    __tablename__ = "publish_runs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    triggered_by = Column(String, nullable=False) # admin username/role
    successful_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    outcome = Column(String, nullable=False) # success / failure

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)  # "editor" or "admin"