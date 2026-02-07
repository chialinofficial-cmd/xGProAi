from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status, Header, Form, Request
from fastapi.responses import FileResponse
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
from services.quant_service import QuantService
from auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi.staticfiles import StaticFiles




import logging

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create Tables on Startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="xGProAi Backend", version="1.0")

@app.get("/")
def read_root():
    return {"message": "xGProAi Backend is Running", "docs_url": "/docs"}

# Startup Event for Migration
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Check if 'result' column exists in 'analyses' table
        result = db.execute(text("PRAGMA table_info(analyses)")).fetchall()
        columns = [row[1] for row in result]
        if "result" not in columns:
            logger.info("Migrating Schema: Adding 'result' column to analyses table...")
            try:
                db.execute(text("ALTER TABLE analyses ADD COLUMN result VARCHAR"))
                db.commit()
                logger.info("Migration Successful.")
            except Exception as e:
                logger.error(f"Migration Failed: {e}")
                db.rollback()

        # Optimize: Ensure Index on created_at
        try:
            logger.info("Checking/Creating Index on analyses.created_at...")
            db.execute(text("CREATE INDEX IF NOT EXISTS ix_analyses_created_at ON analyses (created_at)"))
            db.commit()
        except Exception as e:
            logger.warning(f"Index Creation Failed (might already exist): {e}")
            db.rollback()

        # Optimize: Check/Add columns to 'users' table (Auto-Migration)
        # We try to add columns one by one. If they exist, it fails and we rollback/ignore.
        column_migrations = [
            ("plan_tier", "VARCHAR DEFAULT 'trial'"),
            ("credits_balance", "INTEGER DEFAULT 3"),
            ("daily_usage_count", "INTEGER DEFAULT 0"),
            ("last_usage_date", "TIMESTAMP")
        ]
        
        for col_name, col_type in column_migrations:
            try:
                db.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                db.commit()
                logger.info(f"Migrated: Added {col_name} to users")
            except Exception as e:
                db.rollback()
                # logger.debug(f"Skipped {col_name} (likely exists)")

    except Exception as e:
        logger.error(f"Startup Check Failed: {e}")
    finally:
        db.close()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... (Previous imports)
from sqlalchemy import text

# Custom Image Serving
@app.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    file_path = os.path.join("uploads", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    # Fallback to tmp for serverless if needed, or just return 404
    if os.path.exists(os.path.join("/tmp", filename)):
        return FileResponse(os.path.join("/tmp", filename))
    raise HTTPException(status_code=404, detail="File not found")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Paystack
@app.post("/paystack/initialize")
async def initialize_paystack(payload: dict, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="User ID required")
        
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post("https://api.paystack.co/transaction/initialize", json=payload, headers=headers)
        res_data = response.json()
        
        if not response.ok or not res_data.get("status"):
            logger.error(f"Paystack Error: {res_data}")
            # Return either the Paystack message or a default string
            error_msg = res_data.get("message", "Payment initialization failed at Paystack")
            raise HTTPException(status_code=400, detail=error_msg)
            
        return {"authorization_url": res_data["data"]["authorization_url"]}
        
    except HTTPException as he:
        # Don't wrap HTTP exceptions, let them bubble up
        raise he
    except Exception as e:
        logger.error(f"Paystack Exception: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/paystack/webhook")
async def paystack_webhook(request: Request, db: Session = Depends(get_db)):
    payload_bytes = await request.body()
    signature = request.headers.get('x-paystack-signature')
    
    if not PAYSTACK_SECRET_KEY:
         # Log this specific error for easier debugging
         logger.error("MISSING PAYSTACK_SECRET_KEY")
         raise HTTPException(status_code=500, detail="Server misconfiguration")

    # Verify Signature (HMAC SHA512)
    hash_object = hmac.new(PAYSTACK_SECRET_KEY.encode('utf-8'), msg=payload_bytes, digestmod=hashlib.sha512)
    expected_signature = hash_object.hexdigest()
    
    if signature != expected_signature:
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    event = await request.json()
    
    if event.get("event") == "charge.success":
        data = event["data"]
        metadata = data.get("metadata", {})
        
        user_id = metadata.get("user_id")
        plan_tier = metadata.get("plan_tier") or "active" # Default fallback
        
        if user_id:
            user = db.query(models.User).filter(models.User.firebase_uid == user_id).first()
            if user:
                now = datetime.datetime.utcnow()
                
                # Determine Access Duration
                if plan_tier == "starter":
                    days_to_add = 7
                elif plan_tier in ["active", "advanced", "pro", "monthly"]:
                    days_to_add = 30
                elif plan_tier == "yearly":
                    days_to_add = 365
                else:
                    days_to_add = 30 # Default
                
                if user.subscription_ends_at and user.subscription_ends_at > now:
                     user.subscription_ends_at += datetime.timedelta(days=days_to_add)
                else:
                     user.subscription_ends_at = now + datetime.timedelta(days=days_to_add)
                
                # Save specific tier instead of generic 'pro'
                user.plan_tier = plan_tier 
                
                # Credits are now managed by daily limits, but we can give a high number for legacy compatibility
                user.credits_balance = 999 
                
                db.commit()
                logger.info(f"Paystack Success: {user_id} upgraded to {plan_tier} for {days_to_add} days")
                
    return {"status": "success"}


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
    result: str | None = None # win, loss, breakeven
    created_at: datetime.datetime
    
    class Config:
        orm_mode = True

class AnalysisUpdateResult(BaseModel):
    result: str # win, loss, breakeven

class StatsResponse(BaseModel):
    total_analyses: int
    charts_analyzed: int
    ai_responses: int
    credits_remaining: int
    plan_tier: str
    trial_ends_at: datetime.datetime | None = None
    subscription_ends_at: datetime.datetime | None = None

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

@app.get("/fix-db")
def fix_database_schema(db: Session = Depends(get_db)):
    """
    WARNING: This resets the database schema.
    Use this to apply model changes (e.g. adding new columns).
    """
    try:
        # Avoid circular imports by importing models inside function
        import models
        from database import engine
        
        models.Base.metadata.drop_all(bind=engine)
        models.Base.metadata.create_all(bind=engine)
        return {"status": "success", "message": "Database schema reset successfully. All data cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema reset failed: {str(e)}")

@app.post("/upload")
def upload_chart(file: UploadFile = File(...)):
    # Save file locally
    file_location = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "location": file_location}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_chart(
    file: UploadFile = File(...), 
    equity: float = Form(1000.0), # New input
    db: Session = Depends(get_db),
    x_user_id: str = Header(None),
    x_user_email: str = Header(None) # Capture email
):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="User ID required")

    # Check User Tier & Daily Limit
    user = db.query(models.User).filter(models.User.firebase_uid == x_user_id).first()
    
    # If user doesn't exist in DB yet, create them (lazy sync)
    if not user:
        # 3-Day Free Trial
        trial_expiry = datetime.datetime.utcnow() + datetime.timedelta(days=3)
        user = models.User(
            firebase_uid=x_user_id,
            email=x_user_email, # Save Email
            full_name=x_user_email.split('@')[0] if x_user_email else "Trader",
            plan_tier="trial",
            credits_balance=10,
            trial_ends_at=trial_expiry
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Backfill email if missing for existing user
    if x_user_email and not user.email:
        user.email = x_user_email
        user.full_name = x_user_email.split('@')[0]
        db.add(user)
        db.commit()
        db.refresh(user)

    # 1. ACCESS CONTROL LOGIC
    allow_analysis = False
    daily_limit = 0
    
    # Lazy Daily Reset
    today = datetime.datetime.utcnow().date()
    last_usage = user.last_usage_date.date() if user.last_usage_date else None
    
    if last_usage != today:
        user.daily_usage_count = 0
        user.last_usage_date = datetime.datetime.utcnow()
        db.commit()

    # Determine Limits based on Tier
    if user.plan_tier in ["starter"]:
        daily_limit = 10
    elif user.plan_tier in ["active", "pro", "monthly"]: # 'pro'/monthly fallback for legacy
        daily_limit = 20
    elif user.plan_tier in ["advanced", "yearly"]:
        daily_limit = 100
    elif user.plan_tier == "trial":
        daily_limit = 3 # Hard outcome limit for trial (Total, not daily actually)
    
    # Check Subscription Expiry
    is_subscription_active = False
    if user.plan_tier != "trial" and user.plan_tier != "free":
        if user.subscription_ends_at and user.subscription_ends_at > datetime.datetime.utcnow():
            is_subscription_active = True
        else:
            # Expired
            user.plan_tier = "free"
            db.commit()
            raise HTTPException(status_code=403, detail="Subscription expired. Please renew.")
    
    # Logic Execution
    if is_subscription_active:
        # Check Daily Limit
        if user.daily_usage_count >= daily_limit:
             raise HTTPException(status_code=403, detail=f"Daily limit reached ({daily_limit} uploads/day). Please upgrade for more.")
        
        user.daily_usage_count += 1
        user.last_usage_date = datetime.datetime.utcnow()
        allow_analysis = True
        db.commit()
        
    elif user.plan_tier == "trial":
        # Trial is TOTAL limit, not daily
        if user.credits_balance <= 0 or user.credits_balance > 3: # Enforce 3 max if manually changed
             # Double check if 10 was old default
             if user.credits_balance > 3 and user.credits_balance == 10:
                 user.credits_balance = 3
                 db.commit()
        
        if user.credits_balance <= 0:
             raise HTTPException(status_code=403, detail="Free trial limit reached (3 uploads). Please upgrade.")
             
        now = datetime.datetime.utcnow()
        if user.trial_ends_at and now > user.trial_ends_at:
             user.plan_tier = "free"
             db.commit()
             raise HTTPException(status_code=403, detail="Free trial time expired. Please upgrade.")

        user.credits_balance -= 1
        allow_analysis = True
        db.commit()
        
    else:
        # Free Tier (Expired)
        raise HTTPException(status_code=403, detail="Trial expired. Please upgrade to Pro.")

    if not allow_analysis:
         raise HTTPException(status_code=403, detail="Access denied.")

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

    # 2. AI Analysis & Tri-Model Orchestration
    try:
        from services.ai_service import AIService
        from services.quant_service import QuantService
        from services.sentiment_service import SentimentService
        
        ai_service = AIService()
        quant_service = QuantService()
        sentiment_service = SentimentService()
        
        if not ai_service.api_key:
             logger.error("Error: ANTHROPIC_API_KEY not found in environment.")
             raise HTTPException(status_code=500, detail="Configuration Error: ANTHROPIC_API_KEY is missing.")

        logger.info("Initializing Tri-Model Analysis...")
        
        # --- MODEL 1: SENTIMENT ENGINE ---
        logger.info("1. Sentiment Engine: Checking News...")
        news_risk = sentiment_service.check_high_impact_news()
        
        # SAFETY SWITCH: Reject trade if High Impact News is imminent
        if news_risk.get("risk") == "HIGH":
            event_name = news_risk.get("event")
            logger.warning(f"SAFETY SWITCH TRIGGERED: {event_name}")
            raise HTTPException(status_code=400, detail=f"TRADING PAUSED: High Impact News Detected ({event_name}). System prevents entry during volatility spikes.")
            
        market_sentiment = sentiment_service.get_market_sentiment()
        logger.info(f"   Sentiment: {market_sentiment.get('label')} ({market_sentiment.get('score')})")

        # --- MODEL 2: QUANT ENGINE ---
        logger.info("2. Quant Engine: Analyzing Structure...")
        # Fetch OHLCV (Sync for now, can be async)
        # Note: In async route, we should await if method is async. fetch_ohlcv is async in definition but we need to run it.
        # Since we are in an async def, we can await.
        df = await quant_service.fetch_ohlcv("XAU/USD")
        quant_analysis = quant_service.analyze_market_structure(df)
        logger.info(f"   Quant: {quant_analysis.get('trend')} | Volatility Alert: {quant_analysis.get('volatility_alert')}")

        # --- MODEL 3: VISION ENGINE (SMC) ---
        logger.info("3. Vision Engine: Analyzing Chart with Context...")
        
        # Measure Latency
        start_time = datetime.datetime.utcnow()
        
        # Pass Context to AI
        ai_result_json = ai_service.analyze_chart(
            file_location, 
            equity=equity,
            quant_data=quant_analysis,
            sentiment_data=market_sentiment
        )
        
        end_time = datetime.datetime.utcnow()
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        ai_data = json.loads(ai_result_json)
        
        # Inject Quantitative & Sentiment Data into Final Response for Frontend
        ai_data["quant_engine"] = quant_analysis
        ai_data["sentiment_engine"] = market_sentiment
        
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
            "user_id": x_user_id,
            "processing_time_ms": duration_ms
        }

    except HTTPException as he:
        # Re-raise HTTP exceptions (like the 500 above)
        raise he
    except Exception as e:
        print(f"AI Analysis Failed: {e}")
        # Return a server error instead of mock data
        raise HTTPException(status_code=500, detail=f"AI Analysis Failed: {str(e)}")

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
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@app.patch("/analyses/{analysis_id}/result", response_model=AnalysisResponse)
def update_analysis_result(analysis_id: int, result_data: AnalysisUpdateResult, db: Session = Depends(get_db)):
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis.result = result_data.result
    db.commit()
    db.refresh(analysis)
    return analysis

@app.get("/stats", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    x_user_id: str = Header(None)
):
    try:
        if not x_user_id:
            return {
                "total_analyses": 0,
                "charts_analyzed": 0,
                "ai_responses": 0,
                "credits_remaining": 0,
                "plan_tier": "unknown"
            }

        # Fetch User Freshly
        user = db.query(models.User).filter(models.User.firebase_uid == x_user_id).first()
        tier = user.plan_tier if user else "free"
        credits = user.credits_balance if user else 0
        
        count = db.query(models.Analysis).filter(models.Analysis.user_id == x_user_id).count()

        return {
            "total_analyses": count,
            "charts_analyzed": count, 
            "ai_responses": count,
            "credits_remaining": credits,
            "plan_tier": tier,
            "trial_ends_at": user.trial_ends_at if user else None,
            "subscription_ends_at": user.subscription_ends_at if user else None
        }
    except Exception as e:
        logger.error(f"Stats Error: {e}")
        return {
            "total_analyses": 0, "charts_analyzed": 0, "ai_responses": 0, 
            "credits_remaining": 0, "plan_tier": "error"
        }


# --------------------------
# ADMIN API V2 (Protected)
# --------------------------

ADMIN_SECRET = "admin123" # Simple protection

def verify_admin(x_admin_secret: str = Header(None)):
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Admin Access Denied")

@app.get("/admin/stats")
def get_admin_stats(db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    total_users = db.query(models.User).count()
    pro_users = db.query(models.User).filter(models.User.plan_tier == "pro").count()
    total_analyses = db.query(models.Analysis).count()
    
    revenue_est = pro_users * 29.99 # Updated to avg pro price
    
    return {
        "total_users": total_users,
        "pro_users": pro_users,
        "total_analyses": total_analyses,
        "revenue_estimated": int(revenue_est)
    }

@app.get("/admin/users")
def get_all_users(
    skip: int = 0, 
    limit: int = 50, 
    search: str = None,
    db: Session = Depends(get_db), 
    _: bool = Depends(verify_admin)
):
    query = db.query(models.User)
    if search:
        query = query.filter(models.User.email.ilike(f"%{search}%"))
    
    users = query.order_by(models.User.created_at.desc()).offset(skip).limit(limit).all()
    return users

@app.get("/admin/users/{user_id}/details")
def get_user_details(user_id: int, db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    recent_analyses = db.query(models.Analysis).filter(
        models.Analysis.user_id == user.firebase_uid
    ).order_by(models.Analysis.created_at.desc()).limit(20).all()
    
    return {
        "user": user,
        "analyses": recent_analyses
    }

class CreditUpdate(BaseModel):
    amount: int

@app.post("/admin/users/{user_id}/credits")
def update_user_credits(user_id: int, credit_data: CreditUpdate, db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.credits_balance = credit_data.amount
    db.commit()
    return {"status": "success", "new_balance": user.credits_balance}

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Optional: Delete their analyses too? Yes, for clean up.
    db.query(models.Analysis).filter(models.Analysis.user_id == user.firebase_uid).delete()
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "User deleted"}

@app.get("/admin/analyses")
def get_recent_global_analyses(limit: int = 20, db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    analyses = db.query(models.Analysis).order_by(models.Analysis.created_at.desc()).limit(limit).all()
    return analyses

# Analytics Helpers
@app.get("/admin/analytics/usage")
def get_usage_analytics(db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    # Python-side aggregation for DB compatibility
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    analyses = db.query(models.Analysis).filter(models.Analysis.created_at >= thirty_days_ago).all()
    
    daily_counts = {}
    for a in analyses:
        date_str = a.created_at.strftime("%Y-%m-%d")
        daily_counts[date_str] = daily_counts.get(date_str, 0) + 1
    
    # Fill missing days? Optional.
    data = [{"date": k, "count": v} for k,v in daily_counts.items()]
    return sorted(data, key=lambda x: x["date"])

@app.get("/admin/analytics/assets")
def get_asset_analytics(db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    analyses = db.query(models.Analysis).order_by(models.Analysis.created_at.desc()).limit(500).all()
    asset_counts = {}
    for a in analyses:
        asset = a.asset or "Unknown"
        asset_counts[asset] = asset_counts.get(asset, 0) + 1
    
    return [{"name": k, "value": v} for k,v in asset_counts.items()]

@app.get("/admin/ai/stats")
def get_ai_stats(db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    # 1. Average Confidence
    from sqlalchemy import func
    avg_conf = db.query(func.avg(models.Analysis.confidence)).scalar() or 0
    
    # 2. Average Latency & History
    latencies = db.query(models.Analysis.processing_time_ms, models.Analysis.created_at)\
        .filter(models.Analysis.processing_time_ms != None)\
        .order_by(models.Analysis.created_at.desc()).limit(50).all()
        
    avg_latency = 0
    if latencies:
        avg_latency = sum([l[0] for l in latencies]) / len(latencies)
        
    latency_history = [{"date": l[1].strftime("%H:%M:%S"), "ms": l[0]} for l in reversed(latencies)]

    # 3. "Win Rate" (Simulated via Sentiment for now)
    bullish = db.query(models.Analysis).filter(models.Analysis.bias == "Bullish").count()
    bearish = db.query(models.Analysis).filter(models.Analysis.bias == "Bearish").count()
    
    # Placeholder for actual win rate
    market_accuracy = 56 
    
    return {
        "avg_confidence": int(avg_conf),
        "avg_latency_ms": int(avg_latency),
        "win_rate": market_accuracy,
        "latency_history": latency_history,
        "bias_distribution": [
            {"name": "Bullish", "value": bullish},
            {"name": "Bearish", "value": bearish}
        ]
    }

@app.get("/admin/finance/stats")
def get_financial_stats(db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    # 1. User Tiers count
    starter = db.query(models.User).filter(models.User.plan_tier == "starter").count()
    active = db.query(models.User).filter(models.User.plan_tier == "active").count()
    advanced = db.query(models.User).filter(models.User.plan_tier == "advanced").count()
    pro_legacy = db.query(models.User).filter(models.User.plan_tier == "pro").count()
    
    # 2. MRR Calculation (Approximate based on current pricing)
    # Starter (Week): 45 GHS -> ~180/mo
    # Active (Month): 150 GHS
    # Advanced (Month): 300 GHS
    # Pro (Legacy): 300 GHS (Assumed same as Advanced)
    
    mrr_ghs = (starter * 180) + (active * 150) + (advanced * 300) + (pro_legacy * 300)
    
    # 3. Credit Consumption (Total uploads by paid users)
    # We can approximate this by summing daily_usage_count of paid users today, 
    # but for "Consumption Stats" we might want historical analysis count.
    # For now, let's just return the Tier Distribution which is the main revenue driver.
    
    return {
        "mrr_ghs": mrr_ghs,
        "revenue_breakdown": [
            {"name": "Starter (Weekly)", "value": starter * 45, "users": starter},
            {"name": "Active (Monthly)", "value": active * 150, "users": active},
            {"name": "Advanced (Monthly)", "value": advanced * 300, "users": advanced},
            {"name": "Legacy Pro", "value": pro_legacy * 300, "users": pro_legacy}
        ],
        "tier_distribution": [
            {"name": "Starter", "value": starter},
            {"name": "Active", "value": active},
            {"name": "Advanced", "value": advanced},
            {"name": "Legacy Pro", "value": pro_legacy}
        ]
    }

class TierUpdate(BaseModel):
    tier: str

class TrialExtension(BaseModel):
    days: int

@app.post("/admin/users/{user_id}/tier")
def update_user_tier(user_id: int, tier_data: TierUpdate, db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.plan_tier = tier_data.tier
    # Reset usage to let them use new limits immediately
    user.daily_usage_count = 0
    
    # If upgrading to paid, ensure subscription is active
    if tier_data.tier in ["starter", "active", "advanced", "pro"]:
        now = datetime.datetime.utcnow()
        if not user.subscription_ends_at or user.subscription_ends_at < now:
             user.subscription_ends_at = now + datetime.timedelta(days=30)
             
    db.commit()
    return {"status": "success", "message": f"User upgraded to {tier_data.tier}"}

@app.post("/admin/users/{user_id}/extend-trial")
def extend_user_trial(user_id: int, extension: TrialExtension, db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.datetime.utcnow()
    current_expiry = user.trial_ends_at or now
    if current_expiry < now:
        current_expiry = now
        
    user.trial_ends_at = current_expiry + datetime.timedelta(days=extension.days)
    user.credits_balance += 3 # Give them some credits to use with the time
    
    db.commit()
    return {"status": "success", "new_expiry": user.trial_ends_at}

@app.get("/market-data/{symbol}")
async def get_market_data(symbol: str):
    """
    Fetches live OHLCV data for the chart.
    """
    try:
        # Decode symbol if needed (e.g. XAU-USD -> XAU/USD)
        clean_symbol = symbol.replace("-", "/")
        
        # Instantiate service
        quant = QuantService()
        
        # Fetch Data
        df = await quant.fetch_ohlcv(clean_symbol)
        
        # Format for Lightweight Charts
        data = []
        if not df.empty:
            for _, row in df.iterrows():
                data.append({
                    "time": int(row['timestamp'].timestamp()),
                    "open": row['open'],
                    "high": row['high'],
                    "low": row['low'],
                    "close": row['close']
                })
                
        return data
    except Exception as e:
        logger.error(f"Market Data Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
