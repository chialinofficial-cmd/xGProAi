from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import logging

import models
from dependencies import get_db, verify_admin
from schemas import CreditUpdate, TierUpdate, TrialExtension

# Setup Logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(verify_admin)] # Protect all routes
)

# Note: verify_admin is already a dependency for the whole router, 
# but existing code had it on each endpoint. 
# We can keep it on the router level for cleaner code, EXCEPT for "promote" 
# which might be a public backdoor (checked main.py: promote used Depends(get_db) but verify_admin? No, it used a secret key).
# So "promote" should NOT be under this router if the router has a global dependency.
# Actually, looking at main.py, "promote" does NOT uses verify_admin. It uses a secret string.
# So I should move "promote" to `admin.py` but EXCLUDE it from the router dependency, 
# OR just not put the dependency on the router and add it to each endpoint.
# Adding it to each endpoint is safer for migration to match exact behavior.

router = APIRouter(tags=["Admin"]) # Reset router without global dependency

@router.post("/admin/promote")
def promote_to_admin(email: str, secret: str, uid: str = None, db: Session = Depends(get_db)):
    # Backdoor for initial setup only
    if secret != "super_secret_setup_key_123":
        raise HTTPException(status_code=403, detail="Invalid secret")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin = True
    if uid:
        user.firebase_uid = uid
        logger.info(f"Linked UID {uid} to user {email}")
        
    db.commit()
    return {"status": "success", "message": f"{email} is now an Admin (UID Linked)"}

@router.get("/admin/stats")
def get_admin_stats(db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    try:
        total_users = db.query(models.User).count()
        pro_users = db.query(models.User).filter(models.User.plan_tier == "pro").count()
        total_analyses = db.query(models.Analysis).count()
        
        # Calculate Revenue (Approximate)
        revenue_est = 0
        revenue_est += db.query(models.User).filter(models.User.plan_tier == "pro").count() * 29.99
        revenue_est += db.query(models.User).filter(models.User.plan_tier == "monthly").count() * 29.99
        revenue_est += db.query(models.User).filter(models.User.plan_tier == "yearly").count() * 299.99
        
        return {
            "total_users": total_users,
            "pro_users": pro_users,
            "total_analyses": total_analyses,
            "revenue_estimated": int(revenue_est)
        }
    except Exception as e:
        logger.error(f"Admin Stats Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/admin/users")
def get_all_users(
    skip: int = 0, 
    limit: int = 50, 
    search: str = None,
    db: Session = Depends(get_db), 
    admin: bool = Depends(verify_admin)
):
    try:
        query = db.query(models.User)
        if search:
            query = query.filter(models.User.email.ilike(f"%{search}%"))
        
        users = query.order_by(models.User.created_at.desc()).offset(skip).limit(limit).all()
        return users
    except Exception as e:
        logger.error(f"Admin Users Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/admin/users/{user_id}/details")
def get_user_details(user_id: int, db: Session = Depends(get_db), admin: bool = Depends(verify_admin)):
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

@router.post("/admin/users/{user_id}/credits")
def update_user_credits(user_id: int, credit_data: CreditUpdate, db: Session = Depends(get_db), admin: bool = Depends(verify_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.credits_balance = credit_data.amount
    db.commit()
    return {"status": "success", "new_balance": user.credits_balance}

@router.delete("/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Optional: Delete their analyses too? Yes, for clean up.
    db.query(models.Analysis).filter(models.Analysis.user_id == user.firebase_uid).delete()
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "User deleted"}

@router.get("/admin/analyses")
def get_recent_global_analyses(limit: int = 20, db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    try:
        analyses = db.query(models.Analysis).order_by(models.Analysis.created_at.desc()).limit(limit).all()
        return analyses
    except Exception as e:
        logger.error(f"Admin Analyses Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/admin/content/charts")
def get_admin_charts(db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    try:
        charts = db.query(models.Analysis).order_by(models.Analysis.created_at.desc()).limit(50).all()
        return [
            {
                "id": c.id,
                "asset": c.asset,
                "bias": c.bias,
                "created_at": c.created_at,
                "user_id": c.user_id,
                "image_url": c.image_path 
            }
            for c in charts
        ]
    except Exception as e:
        logger.error(f"Admin Content Charts Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/admin/analytics/usage")
def get_usage_analytics(db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        analyses = db.query(models.Analysis).filter(models.Analysis.created_at >= thirty_days_ago).all()
        
        daily_counts = {}
        for a in analyses:
            date_str = a.created_at.strftime("%Y-%m-%d")
            daily_counts[date_str] = daily_counts.get(date_str, 0) + 1
        
        data = [{"date": k, "count": v} for k,v in daily_counts.items()]
        return sorted(data, key=lambda x: x["date"])
    except Exception as e:
        logger.error(f"Admin Usage Analytics Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/admin/analytics/assets")
def get_asset_analytics(db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    try:
        analyses = db.query(models.Analysis).order_by(models.Analysis.created_at.desc()).limit(500).all()
        asset_counts = {}
        for a in analyses:
            asset = a.asset or "Unknown"
            asset_counts[asset] = asset_counts.get(asset, 0) + 1
        
        return [{"name": k, "value": v} for k,v in asset_counts.items()]
    except Exception as e:
        logger.error(f"Admin Asset Analytics Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/admin/ai/stats")
def get_ai_stats(db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    try:
        avg_conf = db.query(func.avg(models.Analysis.confidence)).scalar() or 0
        
        latencies = db.query(models.Analysis.processing_time_ms, models.Analysis.created_at)\
            .filter(models.Analysis.processing_time_ms != None)\
            .order_by(models.Analysis.created_at.desc()).limit(50).all()
            
        avg_latency = 0
        if latencies:
            avg_latency = sum([l[0] for l in latencies]) / len(latencies)
            
        latency_history = [{"date": l[1].strftime("%H:%M:%S"), "ms": l[0]} for l in reversed(latencies)]

        bullish = db.query(models.Analysis).filter(models.Analysis.bias == "Bullish").count()
        bearish = db.query(models.Analysis).filter(models.Analysis.bias == "Bearish").count()
        
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
    except Exception as e:
        logger.error(f"Admin AI Stats Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/admin/finance/stats")
def get_financial_stats(db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    try:
        starter = db.query(models.User).filter(models.User.plan_tier == "starter").count()
        active = db.query(models.User).filter(models.User.plan_tier == "active").count()
        advanced = db.query(models.User).filter(models.User.plan_tier == "advanced").count()
        pro_legacy = db.query(models.User).filter(models.User.plan_tier == "pro").count()
        
        mrr_ghs = (starter * 180) + (active * 150) + (advanced * 300) + (pro_legacy * 300)
        
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
    except Exception as e:
        logger.error(f"Admin Finance Stats Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.post("/admin/users/{user_id}/tier")
def update_user_tier(user_id: int, tier_data: TierUpdate, db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.plan_tier = tier_data.tier
    user.daily_usage_count = 0
    
    if tier_data.tier in ["starter", "active", "advanced", "pro"]:
        now = datetime.utcnow()
        if not user.subscription_ends_at or user.subscription_ends_at < now:
             user.subscription_ends_at = now + timedelta(days=30)
             
    db.commit()
    return {"status": "success", "message": f"User upgraded to {tier_data.tier}"}

@router.post("/admin/users/{user_id}/extend-trial")
def extend_user_trial(user_id: int, extension: TrialExtension, db: Session = Depends(get_db), _: bool = Depends(verify_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.utcnow()
    current_expiry = user.trial_ends_at or now
    if current_expiry < now:
        current_expiry = now
        
    user.trial_ends_at = current_expiry + timedelta(days=extension.days)
    user.credits_balance += 3
    
    db.commit()
    return {"status": "success", "new_expiry": user.trial_ends_at}
