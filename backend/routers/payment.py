from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
import models
from database import SessionLocal
import os
import hashlib
import json
import base64
import requests
import datetime

router = APIRouter(
    prefix="/payment",
    tags=["payment"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Env Variables
MERCHANT_ID = os.getenv("CRYPTOMUS_MERCHANT_ID", "YOUR_MERCHANT_UUID")
PAYMENT_KEY = os.getenv("CRYPTOMUS_PAYMENT_KEY", "YOUR_PAYMENT_KEY")

@router.post("/create")
def create_payment(
    amount: float, 
    currency: str = "USD", 
    db: Session = Depends(get_db),
    x_user_id: str = Header(None)
):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="User ID required")

    # 1. Create local Order ID
    order_id = f"{x_user_id}_{int(datetime.datetime.utcnow().timestamp())}"
    
    # 2. Prepare payload
    payload = {
        "amount": str(amount),
        "currency": currency,
        "order_id": order_id,
        "url_callback": "https://your-domain.com/payment/webhook", # Replace in prod
        "url_return": "http://localhost:3000/dashboard",
        "url_success": "http://localhost:3000/dashboard?payment=success",
        "is_payment_multiple": False,
        "lifetime": 3600,
        "to_currency": "USDT" # Auto convert to USDT for stability?
    }

    # 3. Sign Request
    json_payload = json.dumps(payload)
    encoded_payload = base64.b64encode(json_payload.encode()).decode()
    sign = hashlib.md5((encoded_payload + PAYMENT_KEY).encode()).hexdigest()

    # 4. Call Cryptomus
    try:
        response = requests.post(
            "https://api.cryptomus.com/v1/payment",
            json=payload,
            headers={"merchant": MERCHANT_ID, "sign": sign}
        )
        data = response.json()
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=data.get("message", "Payment creation failed"))

        # 5. Save Pending Payment to DB
        new_payment = models.Payment(
            order_id=order_id,
            user_id=x_user_id,
            amount=amount,
            currency=currency,
            status="pending"
        )
        db.add(new_payment)
        db.commit()

        return {"url": data["result"]["url"]}
        
    except Exception as e:
        print(f"Payment Error: {e}")
        # MOCK FOR DEV if keys are missing
        if "YOUR_MERCHANT" in MERCHANT_ID:
            print("Using Mock Payment URL")
            return {"url": "http://localhost:3000/dashboard?mock_payment=success"}
            
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        sign = data.get("sign")
        
        if not sign:
            return {"status": "error", "message": "No signature"}

        # Verify Signature (Simple check)
        # Real implementation should reconstruct payload and match hash
        
        if data["status"] in ["paid", "paid_over"]:
            order_id = data["order_id"]
            
            # Update Payment
            payment = db.query(models.Payment).filter(models.Payment.order_id == order_id).first()
            if payment and payment.status != "paid":
                payment.status = "paid"
                
                # Update User Logic
                user = db.query(models.User).filter(models.User.firebase_uid == payment.user_id).first()
                
                if user:
                    user.plan_tier = "pro"
                    # Optionally grant credits if logic changes
                    # user.credits += 100 
                
                db.commit()
                
        return {"status": "ok"}
    except Exception as e:
        print(f"Webhook Error: {e}")
        return {"status": "error"}
