from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import models
from database import SessionLocal, engine
import shutil
import os
import datetime
import json
from auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi.staticfiles import StaticFiles
from routers import payment

# Create Tables on Startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="xGProAi Backend", version="1.0", root_path="/api")

app.include_router(payment.router)

from fastapi.responses import FileResponse

# Custom Image Serving (Handles /tmp for Vercel)
@app.get("/uploads/{filename}")
async def serve_upload(filename: str):
    # Priority 1: Check /tmp (Vercel session uploads)
    tmp_path = os.path.join("/tmp", filename)
    if os.path.exists(tmp_path):
        return FileResponse(tmp_path)
    
    # Priority 2: Check local uploads (Persistent/Dev)
    local_path = os.path.join("uploads", filename)
    if os.path.exists(local_path):
        return FileResponse(local_path)
        
    raise HTTPException(status_code=404, detail="Image not found")

# Still mount static for other potential assets if needed, but the route above takes precedence for specific files
try:
    os.makedirs("uploads", exist_ok=True)
    # mount to a different name to avoid conflict if desired, or keep as fallback
    # app.mount("/static_uploads", StaticFiles(directory="uploads"), name="uploads")
    pass 
except Exception:
    pass

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime.datetime
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class AnalysisResponse(BaseModel):
    id: int
    asset: str
    bias: str
    confidence: int
    summary: str
    entry: float | None = None
    sl: float | None = None
    tp1: float | None = None
    tp2: float | None = None
    risk_reward: str | None = None
    sentiment: str | None = None
    image_path: str
    created_at: datetime.datetime
    
    class Config:
        orm_mode = True

class StatsResponse(BaseModel):
    total_analyses: int
    charts_analyzed: int
    ai_responses: int
    credits_remaining: int

# Routes
@app.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "xGProAi Backend (Online)"}

@app.post("/upload")
def upload_chart(file: UploadFile = File(...)):
    # Save file locally
    file_location = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "location": file_location}

@app.post("/analyze", response_model=AnalysisResponse)
def analyze_chart(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    x_user_id: str = Header(None)
):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="User ID required")

    # Check User Tier & Daily Limit
    user = db.query(models.User).filter(models.User.firebase_uid == x_user_id).first()
    
    # If user doesn't exist in DB yet, create them (lazy sync)
    if not user:
        user = models.User(firebase_uid=x_user_id, plan_tier="free")
        db.add(user)
        db.commit()
        db.refresh(user)

    if user.plan_tier != "pro":
        today = datetime.datetime.utcnow().date()
        today_count = db.query(models.Analysis).filter(
            models.Analysis.user_id == x_user_id,
            models.Analysis.created_at >= today
        ).count()
    
        if today_count >= 3:
            raise HTTPException(status_code=403, detail="Daily credit limit reached (3/3). Upgrade to Pro.")

    # 1. Save File
    # Use /tmp for Vercel Serverless compatibility
    filename = file.filename
    upload_dir = "/tmp" if os.path.exists("/tmp") else "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    physical_path = os.path.join(upload_dir, filename)
    
    # DB Path: Always use "uploads/" prefix so frontend URLs work consistently
    # e.g. https://api.../uploads/image.png
    db_image_path = f"uploads/{filename}"
    
    with open(physical_path, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Pass physical path to AI Service
    file_location = physical_path

    # 2. AI Analysis
    try:
        from services.ai_service import AIService
        
        ai_service = AIService()
        
        # Check if API key is set
        if not ai_service.api_key:
            # Fallback to Mock if no key
            print("No ANTHROPIC_API_KEY found. Using mock data.")
            mock_analysis = {
                "asset": "XAU/USD",
                "bias": "Bullish",
                "confidence": 88,
                "summary": "Mock: Rejection from 4920 support level. Uptrend continuing.",
                "image_path": file_location,
                "user_id": x_user_id
            }
            analysis_data = mock_analysis
        else:
            print("Analyzing with Claude 3.5 Sonnet...")
            ai_result_json = ai_service.analyze_chart(file_location)
            ai_data = json.loads(ai_result_json)
            
            # Map AI result to DB model
            levels = ai_data.get("levels", {})
            metrics = ai_data.get("metrics", {})
            
            # Robust float conversion helper
            def to_float(val):
                try:
                    return float(str(val).replace(",", "")) if val else None
                except:
                    return None

            analysis_data = {
                "asset": "XAU/USD",
                "bias": ai_data.get("bias", "Neutral"),
                "confidence": ai_data.get("confidence", 50),
                "summary": ai_data.get("summary", "Analysis failed."),
                "entry": to_float(levels.get("entry")),
                "sl": to_float(levels.get("sl")),
                "tp1": to_float(levels.get("tp1")),
                "tp2": to_float(levels.get("tp2")),
                "risk_reward": metrics.get("risk_reward", "N/A"),
                "sentiment": metrics.get("sentiment", "Neutral"),
                "image_path": db_image_path,
                "user_id": x_user_id
            }

    except Exception as e:
        print(f"AI Analysis Failed: {e}")
        # Fallback error data
        analysis_data = {
            "asset": "XAU/USD",
            "bias": "Error",
            "confidence": 0,
            "summary": f"AI Error: {str(e)}",
            "entry": 0.0, 
            "sl": 0.0,
            "tp1": 0.0,
            "image_path": file_location,
            "user_id": x_user_id
        }

    # 3. Save to DB
    db_analysis = models.Analysis(**analysis_data)
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)

    return db_analysis

@app.get("/analyses", response_model=list[AnalysisResponse])
def get_analyses(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    x_user_id: str = Header(None)
):
    if not x_user_id:
        return []
    
    analyses = db.query(models.Analysis).filter(
        models.Analysis.user_id == x_user_id
    ).order_by(models.Analysis.created_at.desc()).offset(skip).limit(limit).all()
    return analyses

@app.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@app.get("/stats", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    x_user_id: str = Header(None)
):
    if not x_user_id:
        return {
            "total_analyses": 0,
            "charts_analyzed": 0,
            "ai_responses": 0,
            "credits_remaining": 3
        }

    count = db.query(models.Analysis).filter(models.Analysis.user_id == x_user_id).count()
    
    today = datetime.datetime.utcnow().date()
    today_count = db.query(models.Analysis).filter(
        models.Analysis.user_id == x_user_id,
        models.Analysis.created_at >= today
    ).count()

    return {
        "total_analyses": count,
        "charts_analyzed": count, 
        "ai_responses": count,
        "credits_remaining": max(0, 3 - today_count)
    }
