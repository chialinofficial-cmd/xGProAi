from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
import os
import jwt
import datetime
from datetime import timedelta

router = APIRouter(tags=["Admin Auth"])

class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_JWT_SECRET = os.getenv("ADMIN_JWT_SECRET")
ALGORITHM = "HS256"

@router.post("/admin/auth/login", response_model=Token)
def admin_login(creds: AdminLogin):
    if creds.username != ADMIN_USERNAME or creds.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create Token
    expire = datetime.datetime.utcnow() + timedelta(minutes=60 * 24) # 24 hours
    to_encode = {"sub": "admin", "exp": expire}
    encoded_jwt = jwt.encode(to_encode, ADMIN_JWT_SECRET, algorithm=ALGORITHM)
    
    return {"access_token": encoded_jwt, "token_type": "bearer"}
