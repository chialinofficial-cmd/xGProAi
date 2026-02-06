from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status, Header, Form
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




# Create Tables on Startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="xGProAi Backend", version="1.0", root_path="/api")



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
# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------
# Paystack Integration
# -----------------
import requests
import hashlib
import hmac
from fastapi import Request

# Paystack Configuration
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PaystackInitRequest(BaseModel):
    amount: float
    email: str

@app.post("/paystack/initialize")
def initialize_paystack_transaction(request: PaystackInitRequest, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="User ID required")
    
    # Paystack Configured for GHS (Ghana Cedis)
    # Conversion Rate approx 1 USD = 15 GHS (Dynamic fallback used generally)
    
    if abs(request.amount - 2.99) < 0.1:
        amount_local = 45    # ~ $3 * 15
        plan_tier = "starter"
    elif abs(request.amount - 9.99) < 0.1:
        amount_local = 150   # ~ $10 * 15
        plan_tier = "active"
    elif abs(request.amount - 29.99) < 0.1:
        amount_local = 450   # ~ $30 * 15
        plan_tier = "advanced"
    elif request.amount == 20: 
        amount_local = 300   # Legacy
        plan_tier = "monthly"
    elif request.amount == 204:
        amount_local = 3000  # Legacy
        plan_tier = "yearly"
    else:
        # Fallback for dynamic amounts
        amount_local = request.amount * 15
        plan_tier = "custom"

    # Paystack requires amount in smallest currency unit (Pesewas for GHS) -> * 100
    amount_kobo = int(amount_local * 100) 

    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    callback_url = os.getenv("FRONTEND_URL", "http://localhost:3000") + '/dashboard?payment=success'
    
    payload = {
        "email": request.email,
        "amount": amount_kobo,
        "currency": "GHS", # GHS for Ghana Cedis
        "callback_url": callback_url,
        "metadata": {
            "user_id": x_user_id,
            "plan_tier": plan_tier
        }
    }
    
    try:
        response = requests.post("https://api.paystack.co/transaction/initialize", json=payload, headers=headers)
        res_data = response.json()
        
        if not response.ok or not res_data.get("status"):
            print(f"Paystack Error: {res_data}")
            # Return either the Paystack message or a default string
            error_msg = res_data.get("message", "Payment initialization failed at Paystack")
            raise HTTPException(status_code=400, detail=error_msg)
            
        return {"authorization_url": res_data["data"]["authorization_url"]}
        
    except HTTPException as he:
        # Don't wrap HTTP exceptions, let them bubble up
        raise he
    except Exception as e:
        print(f"Paystack Exception: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/paystack/webhook")
async def paystack_webhook(request: Request, db: Session = Depends(get_db)):
    payload_bytes = await request.body()
    signature = request.headers.get('x-paystack-signature')
    
    if not PAYSTACK_SECRET_KEY:
         # Log this specific error for easier debugging
         print("MISSING PAYSTACK_SECRET_KEY")
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
        plan_tier = metadata.get("plan_tier")
        
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
                    days_to_add = 30 # Default safety fallback
                
                if user.subscription_ends_at and user.subscription_ends_at > now:
                     user.subscription_ends_at += datetime.timedelta(days=days_to_add)
                else:
                     user.subscription_ends_at = now + datetime.timedelta(days=days_to_add)
                
                user.plan_tier = "pro" # Grant 'pro' status access for all paid tiers
                user.credits_balance = 999999 
                db.commit()
                print(f"Paystack Success: {user_id} upgraded to Pro ({plan_tier}) for {days_to_add} days")
                
    return {"status": "success"}

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
    x_user_id: str = Header(None)
):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="User ID required")

    # Check User Tier & Daily Limit
    user = db.query(models.User).filter(models.User.firebase_uid == x_user_id).first()
    
    # If user doesn't exist in DB yet, create them (lazy sync)
    # If user doesn't exist in DB yet, create them (lazy sync)
    if not user:
        # 3-Day Free Trial
        trial_expiry = datetime.datetime.utcnow() + datetime.timedelta(days=3)
        user = models.User(
            firebase_uid=x_user_id, 
            plan_tier="trial",
            credits_balance=10,
            trial_ends_at=trial_expiry
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 1. ACCESS CONTROL LOGIC
    allow_analysis = False
    
    # Check Pro Status
    if user.plan_tier == "pro":
        if user.subscription_ends_at and user.subscription_ends_at > datetime.datetime.utcnow():
            allow_analysis = True
        else:
            # Subscription expired, downgrade to expired trial
            user.plan_tier = "free"
            db.commit()
            raise HTTPException(status_code=403, detail="Subscription expired. Please renew.")
            
    # Check Trial Status
    elif user.plan_tier == "trial":
        now = datetime.datetime.utcnow()
        if user.trial_ends_at and now > user.trial_ends_at:
             user.plan_tier = "free"
             db.commit()
             raise HTTPException(status_code=403, detail="Free trial expired (3 days ended). Please upgrade to Pro.")
        
        if user.credits_balance <= 0:
             raise HTTPException(status_code=403, detail="Trial credits exhausted (10/10 used). Please upgrade to Pro.")
             
        # Deduct Credit if Trial
        user.credits_balance -= 1
        allow_analysis = True
        db.commit() # Save deduction
        
    else:
        # Free Tier (Expired Trial)
        raise HTTPException(status_code=403, detail="Trial expired. Please upgrade to Pro for unlimited access.")

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

    # 2. AI Analysis
    try:
        from services.ai_service import AIService
        
        ai_service = AIService()
        
        if not ai_service.api_key:
             print("Error: ANTHROPIC_API_KEY not found in environment.")
             raise HTTPException(status_code=500, detail="Configuration Error: ANTHROPIC_API_KEY is missing. Please add it to your environment variables to perform real AI analysis.")

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

@app.post("/admin/users/{user_id}/upgrade")
def manual_upgrade_user(user_id: int, db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Grant Pro for 30 days
    user.plan_tier = "pro"
    user.credits_balance = 999999
    
    now = datetime.datetime.utcnow()
    if user.subscription_ends_at and user.subscription_ends_at > now:
        user.subscription_ends_at += datetime.timedelta(days=30)
    else:
        user.subscription_ends_at = now + datetime.timedelta(days=30)
        
    db.commit()
    return {"status": "success", "message": f"User {user.email} upgraded to Pro"}
