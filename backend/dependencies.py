from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import SessionLocal
import models

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Admin Dependency
def verify_admin(x_user_id: str = Header(None), db: Session = Depends(get_db)):
    if not x_user_id:
        raise HTTPException(status_code=403, detail="Admin Access Denied: User ID missing")
    
    user = db.query(models.User).filter(models.User.firebase_uid == x_user_id).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin Access Denied: Not an admin")
    return True
