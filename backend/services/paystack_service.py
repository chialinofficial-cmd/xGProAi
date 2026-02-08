import requests
import os
import hmac
import hashlib
import logging

logger = logging.getLogger(__name__)

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")
PAYSTACK_INIT_URL = "https://api.paystack.co/transaction/initialize"
PAYSTACK_VERIFY_URL = "https://api.paystack.co/transaction/verify"

class PaystackService:
    def __init__(self):
        if not PAYSTACK_SECRET_KEY:
            logger.warning("PAYSTACK_SECRET_KEY is not set. Payments will fail.")

    def initialize_transaction(self, email: str, amount_ghs: float, plan_tier: str, user_id: str):
        """
        Initialize a Paystack transaction.
        amount_ghs: Amount in Ghana Cedis
        """
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        }
        
        # Paystack expects amount in kobo (lowest currency unit). 
        # For GHS, it's pesewas. 1 GHS = 100 Pesewas.
        amount_kobo = int(amount_ghs * 100)
        
        # Callback URL (Frontend URL to redirect to after payment)
        callback_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000") + "/payment/verify"

        payload = {
            "email": email,
            "amount": amount_kobo,
            "currency": "GHS",
            "callback_url": callback_url,
            "metadata": {
                "user_id": user_id,
                "plan_tier": plan_tier,
                "custom_fields": [
                    {
                        "display_name": "Plan Tier",
                        "variable_name": "plan_tier",
                        "value": plan_tier
                    }
                ]
            }
        }

        try:
            response = requests.post(PAYSTACK_INIT_URL, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack Init Error: {e}")
            if e.response:
                logger.error(e.response.text)
            return None

    def verify_transaction(self, reference: str):
        """
        Verify a transaction by reference.
        """
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        }
        
        url = f"{PAYSTACK_VERIFY_URL}/{reference}"
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack Verify Error: {e}")
            return None

    def verify_webhook_signature(self, payload_body: bytes, signature_header: str) -> bool:
        """
        Verify that the webhook request is genuinely from Paystack.
        """
        if not PAYSTACK_SECRET_KEY:
            return False
            
        hash_object = hmac.new(
            PAYSTACK_SECRET_KEY.encode('utf-8'),
            msg=payload_body,
            digestmod=hashlib.sha512
        )
        expected_signature = hash_object.hexdigest()
        return hmac.compare_digest(expected_signature, signature_header)
