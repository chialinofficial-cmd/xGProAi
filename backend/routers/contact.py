from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactRequest(BaseModel):
    name: str
    email: str
    message: str


@router.post("")
async def send_contact_message(payload: ContactRequest):
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    recipient = "xgproai@gmail.com"

    if not smtp_user or not smtp_pass:
        raise HTTPException(status_code=500, detail="Email service not configured.")

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[xGPro Contact] Message from {payload.name}"
        msg["From"] = smtp_user
        msg["To"] = recipient
        msg["Reply-To"] = payload.email

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background:#0a0a0a; color:#fff; padding:32px;">
          <div style="max-width:560px; margin:auto; background:#111; border:1px solid #333; border-radius:12px; padding:32px;">
            <h2 style="color:#D4AF37; margin-top:0;">New Contact Message</h2>
            <table style="width:100%; border-collapse:collapse;">
              <tr><td style="color:#888; padding:8px 0; width:110px;">From</td><td style="color:#fff;">{payload.name}</td></tr>
              <tr><td style="color:#888; padding:8px 0;">Reply-To</td><td><a href="mailto:{payload.email}" style="color:#D4AF37;">{payload.email}</a></td></tr>
            </table>
            <hr style="border-color:#222; margin:20px 0;">
            <p style="color:#ccc; line-height:1.6; white-space:pre-wrap;">{payload.message}</p>
            <p style="color:#555; font-size:12px; margin-top:24px;">Sent via xGPro Contact Form</p>
          </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, recipient, msg.as_string())

        return {"success": True, "message": "Message sent successfully!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
