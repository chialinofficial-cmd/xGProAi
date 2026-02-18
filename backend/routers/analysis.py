from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import shutil
import os
import json
import logging

import models
import models
from dependencies import get_db
from auth import get_current_user
from schemas import AnalysisResponse, AnalysisUpdateResult, ChatMessage
from services.ai_service import AIService
from services.quant_service import QuantService
from services.sentiment_service import SentimentService
from services.chat_service import ChatService

# Setup Logger
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analysis"])

@router.post("/upload")
def upload_chart(file: UploadFile = File(...)):
    # Save file locally
    file_location = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "location": file_location}

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_chart(
    file: UploadFile = File(...), 
    equity: float = Form(1000.0), 
    db: Session = Depends(get_db),
    x_user_id: str = Header(None),
    x_user_email: str = Header(None) 
):
    try:
        if not x_user_id:
            raise HTTPException(status_code=400, detail="User ID required")

        # Check User Tier & Daily Limit
        user = db.query(models.User).filter(models.User.firebase_uid == x_user_id).first()
        
        # If not found by UID, try finding by Email
        if not user and x_user_email:
             user = db.query(models.User).filter(models.User.email == x_user_email).first()
             if user:
                 logger.info(f"User found by email {x_user_email}, updating UID to {x_user_id}")
                 user.firebase_uid = x_user_id
                 db.commit()
                 db.refresh(user)

        # If user doesn't exist in DB yet, create them (lazy sync)
        if not user:
            # 3-Day Free Trial
            trial_expiry = datetime.utcnow() + timedelta(days=3)
            user = models.User(
                firebase_uid=x_user_id,
                email=x_user_email, 
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
        today = datetime.utcnow().date()
        last_usage = user.last_usage_date.date() if user.last_usage_date else None
        
        if last_usage != today:
            user.daily_usage_count = 0
            user.last_usage_date = datetime.utcnow()
            db.commit()

        # Determine Limits based on Tier
        if user.plan_tier in ["starter"]:
            daily_limit = 10
        elif user.plan_tier in ["active", "pro", "monthly"]:
            daily_limit = 20
        elif user.plan_tier in ["advanced", "yearly"]:
            daily_limit = 100
        elif user.plan_tier == "trial":
            daily_limit = 3 
        
        # Check Subscription Expiry
        is_subscription_active = False
        if user.plan_tier != "trial" and user.plan_tier != "free":
            if user.subscription_ends_at and user.subscription_ends_at > datetime.utcnow():
                is_subscription_active = True
            else:
                user.plan_tier = "free"
                db.commit()
                raise HTTPException(status_code=403, detail="Subscription expired. Please renew.")
        
        # Logic Execution
        if is_subscription_active:
            if user.daily_usage_count >= daily_limit:
                 raise HTTPException(status_code=403, detail=f"Daily limit reached ({daily_limit} uploads/day). Please upgrade for more.")
            
            user.daily_usage_count += 1
            user.last_usage_date = datetime.utcnow()
            allow_analysis = True
            db.commit()
            
        elif user.plan_tier == "trial":
            if user.credits_balance <= 0 or user.credits_balance > 3: 
                 if user.credits_balance > 3 and user.credits_balance == 10:
                     user.credits_balance = 3
                     db.commit()
            
            if user.credits_balance <= 0:
                 raise HTTPException(status_code=403, detail="Free trial limit reached (3 uploads). Please upgrade.")
                 
            now = datetime.utcnow()
            if user.trial_ends_at and now > user.trial_ends_at:
                 user.plan_tier = "free"
                 db.commit()
                 raise HTTPException(status_code=403, detail="Free trial time expired. Please upgrade.")

            user.credits_balance -= 1
            allow_analysis = True
            db.commit()
            
        else:
            raise HTTPException(status_code=403, detail="Trial expired. Please upgrade to Pro.")

        if not allow_analysis:
             raise HTTPException(status_code=403, detail="Access denied.")

        # 1. Save File
        filename = file.filename
        upload_dir = "/tmp" if os.path.exists("/tmp") else "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        physical_path = os.path.join(upload_dir, filename)
        db_image_path = f"uploads/{filename}"
        
        with open(physical_path, "wb+") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_location = physical_path

        # 2. AI Analysis & Tri-Model Orchestration
        try:
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
            
            if news_risk.get("risk") == "HIGH":
                event_name = news_risk.get("event")
                logger.warning(f"SAFETY SWITCH TRIGGERED: {event_name}")
                raise HTTPException(status_code=400, detail=f"TRADING PAUSED: High Impact News Detected ({event_name}). System prevents entry during volatility spikes.")
                
            market_sentiment = sentiment_service.get_market_sentiment()
            logger.info(f"   Sentiment: {market_sentiment.get('label')} ({market_sentiment.get('score')})")

            # --- MODEL 2: QUANT ENGINE (Multi-Timeframe) ---
            logger.info("2. Quant Engine: Analyzing Market Structure (D1, H4, H1)...")
            quant_context = await quant_service.get_multi_timeframe_analysis("XAU/USD")
            
            alignment = quant_context.get("alignment", "Unavailable")
            trend_1h = quant_context.get("1h", {}).get("trend", "Neutral")
            logger.info(f"   Quant Alignment: {alignment} | 1H Trend: {trend_1h}")

            # --- MODEL 3: VISION ENGINE (SMC) ---
            logger.info("3. Vision Engine: Analyzing Chart with Context...")
            
            start_time = datetime.utcnow()
            
            ai_result_json = ai_service.analyze_chart(
                file_location, 
                equity=equity,
                quant_data=quant_context,
                sentiment_data=market_sentiment
            )
            
            end_time = datetime.utcnow()
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            ai_data = json.loads(ai_result_json)
            
            ai_data["quant_engine"] = quant_context
            ai_data["sentiment_engine"] = market_sentiment
            
            levels = ai_data.get("levels", {})
            metrics = ai_data.get("metrics", {})
            
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
                "recommendation": ai_data.get("recommendation", "WAIT"),
                "entry": to_float(levels.get("entry")),
                "sl": to_float(levels.get("sl")),
                "tp1": to_float(levels.get("tp1")),
                "tp2": to_float(levels.get("tp2")),
                "risk_reward": metrics.get("risk_reward", "N/A"),
                "sentiment": metrics.get("sentiment", "Neutral"),
                "image_path": db_image_path,
                "user_id": x_user_id,
                "processing_time_ms": duration_ms,
                "meta_data": {
                    "quant": quant_context,
                    "sentiment": market_sentiment
                }
            }
        
        except HTTPException as he:
             raise he

    except Exception as e:
        logger.error(f"Analysis Endpoint Failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Analysis Failed: {str(e)}"}
        )

    # 3. Save to DB
    try:
        db_analysis = models.Analysis(**analysis_data)
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        
        # Map to Response Schema manually to include hydrated fields
        response = AnalysisResponse.from_orm(db_analysis)
        response.quant_engine = quant_context
        response.sentiment_engine = market_sentiment
        
        return response
    except Exception as e:
         logger.error(f"Database Save Failed: {e}")
         raise HTTPException(status_code=500, detail=f"Failed to save results: {str(e)}")

@router.get("/analyses", response_model=list[AnalysisResponse])
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

@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
def read_analysis(analysis_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    # Security: Ensure user owns analysis or is admin
    if analysis.user_id != current_user.firebase_uid and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view this analysis")

    # Map meta_data to response fields
    response = AnalysisResponse.from_orm(analysis)
    if analysis.meta_data:
        response.quant_engine = analysis.meta_data.get("quant")
        response.sentiment_engine = analysis.meta_data.get("sentiment")

    return response

@router.patch("/analyses/{analysis_id}/result", response_model=AnalysisResponse)
def update_analysis_result(analysis_id: int, result_data: AnalysisUpdateResult, db: Session = Depends(get_db)):
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis.result = result_data.result
    db.commit()
    db.refresh(analysis)
    return analysis

@router.get("/market-data/{symbol}")
async def get_market_data(symbol: str, timeframe: str = "1h"):
    try:
        clean_symbol = symbol.replace("-", "/")
        quant = QuantService()
        
        valid_timeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]
        if timeframe not in valid_timeframes:
            timeframe = "1h" 

        df = await quant.fetch_ohlcv(clean_symbol, timeframe=timeframe)
        
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

@router.post("/chat/message")
async def chat_message(chat_data: ChatMessage, x_user_id: str = Header(None), db: Session = Depends(get_db)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="User ID required")
        
    chat_service = ChatService()
    
    return StreamingResponse(
        chat_service.stream_chat_response(chat_data.message, chat_data.history),
        media_type="text/plain"
    )
