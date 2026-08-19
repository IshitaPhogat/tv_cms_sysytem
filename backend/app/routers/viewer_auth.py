from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String

from ..database import Base, SessionLocal, engine

router = APIRouter(prefix="/viewer", tags=["Viewer Auth"])

# Define ViewerUser Model
class ViewerUser(Base):
    __tablename__ = "viewer_users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

# Automatically create the viewer_users table if it doesn't exist
Base.metadata.create_all(bind=engine)

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password_hash: str

class UserLogin(BaseModel):
    email: EmailStr
    password_hash: str

@router.post("/register")
def register_viewer(user: UserRegister):
    db = SessionLocal()
    existing = db.query(ViewerUser).filter(ViewerUser.email == user.email).first()
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    new_user = ViewerUser(name=user.name, email=user.email, password_hash=user.password_hash)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.close()
    return {"message": "Registered successfully", "user": {"id": new_user.id, "name": new_user.name, "email": new_user.email}}

@router.post("/login")
def login_viewer(credentials: UserLogin):
    db = SessionLocal()
    user = db.query(ViewerUser).filter(ViewerUser.email == credentials.email, ViewerUser.password_hash == credentials.password_hash).first()
    db.close()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"message": "Login successful", "user": {"id": user.id, "name": user.name, "email": user.email}}