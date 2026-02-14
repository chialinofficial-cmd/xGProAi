from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

import models
from dependencies import get_db
from schemas import StatsResponse, PaymentInit
from services.paystack_service import PaystackService

# Setup Logger
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Users"])

@router.get("/stats", response_model=StatsResponse)
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
            "subscription_ends_at": user.subscription_ends_at if user else None,
            "mobile": user.mobile if user else None,
            "country": user.country if user else None,
            "gender": user.gender if user else None,
            "age_group": user.age_group if user else None
        }
    except Exception as e:
        logger.error(f"Stats Error: {e}")
        # Return friendly error structure
        return {
            "total_analyses": 0, "charts_analyzed": 0, "ai_responses": 0, 
            "credits_remaining": 0, "plan_tier": "error"
        }

# --- Payment Integration (Paystack) ---

@router.post("/paystack/initialize")
def initialize_payment(payment: PaymentInit, x_user_id: str = Header(None), db: Session = Depends(get_db)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="User ID required")
        
    # Get User
    user = db.query(models.User).filter(models.User.firebase_uid == x_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Initialize Paystack
    paystack = PaystackService()
    try:
        # We pass amount in GHS directly, service handles conversion to kobo if needed
        result = paystack.initialize_transaction(
            email=payment.email, 
            amount_ghs=payment.amount, 
            plan_tier=payment.plan_tier, 
            user_id=x_user_id
        )
        
        if not result or not result.get('status'):
             raise HTTPException(status_code=400, detail="Failed to initialize payment")
             
        return result['data'] # Contains authorization_url
    except Exception as e:
        logger.error(f"Payment Init Error: {e}")
        raise HTTPException(status_code=500, detail="Payment initialization failed")

@router.post("/paystack/webhook")
async def paystack_webhook(request: Request, db: Session = Depends(get_db)):
    payload_bytes = await request.body()
    signature = request.headers.get('x-paystack-signature')
    
    paystack = PaystackService()
    if not paystack.verify_webhook_signature(payload_bytes, signature):
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
                now = datetime.utcnow()
                
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
                     user.subscription_ends_at += timedelta(days=days_to_add)
                else:
                     user.subscription_ends_at = now + timedelta(days=days_to_add)
                
                user.plan_tier = plan_tier 
                user.credits_balance = 999 
                
                db.commit()
                logger.info(f"Paystack Success: {user_id} upgraded to {plan_tier} for {days_to_add} days")
                
    return {"status": "success"}

@router.get("/paystack/verify/{reference}")
def verify_payment(reference: str, db: Session = Depends(get_db)):
    paystack = PaystackService()
    result = paystack.verify_transaction(reference)
    
    if not result or not result.get('status'):
        raise HTTPException(status_code=400, detail="Verification failed")
        
    data = result['data']
    status = data.get('status')
    
    if status == 'success':
        # Extraction
        metadata = data.get('metadata', {})
        user_id = metadata.get('user_id')
        plan_tier = metadata.get('plan_tier')
        amount_paid = data.get('amount') / 100 # Convert back to GHS
        
        if user_id and plan_tier:
            user = db.query(models.User).filter(models.User.firebase_uid == user_id).first()
            if user:
                user.plan_tier = plan_tier
                user.daily_usage_count = 0 # Reset usage
                
                # Set Subscription Expiry
                duration_days = 30
                if plan_tier == 'starter': 
                    duration_days = 7
                elif plan_tier == 'active':
                    duration_days = 30
                elif plan_tier == 'advanced':
                    duration_days = 30
                elif plan_tier == 'yearly':
                    duration_days = 365
                    
                user.subscription_ends_at = datetime.utcnow() + timedelta(days=duration_days)
                
                db.commit()
                
                # Save Payment Record
                payment = models.Payment(
                    order_id=reference,
                    user_id=user_id,
                    amount=amount_paid,
                    currency="GHS",
                    status="paid"
                )
                db.add(payment)
                db.commit()
                
                return {"status": "success", "message": "Payment verified and plan updated"}
    
    return {"status": "failed", "message": "Payment verification failed or not successful"}
