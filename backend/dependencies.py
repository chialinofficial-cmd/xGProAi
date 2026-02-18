from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import os
import jwt

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Admin Dependency
def verify_admin(x_user_id: str = Header(None), authorization: str = Header(None), db: Session = Depends(get_db)):
    # 1. Check for Bearer Token (Standalone Admin)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            ADMIN_JWT_SECRET = os.getenv("ADMIN_JWT_SECRET")
            payload = jwt.decode(token, ADMIN_JWT_SECRET, algorithms=["HS256"])
            if payload.get("sub") == "admin":
                return True
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Admin Token Expired")
        except jwt.InvalidTokenError:
            pass # Fallthrough to User Check
            
    # 2. Fallback to User-based Admin (Legacy / User Dashboard Access)
    if not x_user_id:
        raise HTTPException(status_code=403, detail="Admin Access Denied: Authentication required")
    
    user = db.query(models.User).filter(models.User.firebase_uid == x_user_id).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin Access Denied: Not an admin")
    return True
