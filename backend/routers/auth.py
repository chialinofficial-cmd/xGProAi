from fastapi import APIRouter, Depends, HTTPException, Request, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

import models
from dependencies import get_db
from schemas import UserCreate, UserResponse, Token, ProfileUpdate
from auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from limiter import limiter

router = APIRouter(tags=["Authentication"])

@router.post("/signup", response_model=UserResponse)
@limiter.limit("5/minute")
def signup(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.put("/profile")
def update_profile(profile: ProfileUpdate, x_user_id: str = Header(None), db: Session = Depends(get_db)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="User ID required")
        
    user = db.query(models.User).filter(models.User.firebase_uid == x_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if profile.mobile is not None: user.mobile = profile.mobile
    if profile.country is not None: user.country = profile.country
    if profile.gender is not None: user.gender = profile.gender
    if profile.age_group is not None: user.age_group = profile.age_group
    
    db.commit()
    return {"status": "success", "message": "Profile updated successfully"}
