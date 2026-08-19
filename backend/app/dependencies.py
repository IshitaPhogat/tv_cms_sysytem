from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db


def get_current_user_role(x_user_role: str = Header(default="editor"), db: Session = Depends(get_db)):
    """
    Simulates checking user role via request headers (e.g., X-User-Role: admin).
    In production, this would decode a JWT token.
    """
    if x_user_role not in ["editor", "admin"]:
        raise HTTPException(status_code=401, detail="Invalid or missing user role header.")
    return x_user_role

def require_admin(role: str = Depends(get_current_user_role)):
    """Dependency to strictly enforce admin-only actions (like publishing catalog)."""
    if role != "admin":
        raise HTTPException(
            status_code=403, 
            detail="Access blocked. You are not an Admin."
        )
    return role