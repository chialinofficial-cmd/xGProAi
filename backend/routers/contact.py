from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import resend
import os

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactRequest(BaseModel):
    name: str
    email: str
    message: str


@router.post("")
async def send_contact_message(payload: ContactRequest):
    api_key = os.getenv("RESEND_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="Email service not configured.")

    resend.api_key = api_key

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background:#0a0a0a; color:#fff; padding:32px;">
      <div style="max-width:560px; margin:auto; background:#111; border:1px solid #333; border-radius:12px; padding:32px;">
        <h2 style="color:#D4AF37; margin-top:0;">📩 New Contact Message</h2>
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="color:#888; padding:8px 0; width:110px; vertical-align:top;">From</td>
            <td style="color:#fff; font-weight:bold;">{payload.name}</td>
          </tr>
          <tr>
            <td style="color:#888; padding:8px 0; vertical-align:top;">Reply-To</td>
            <td><a href="mailto:{payload.email}" style="color:#D4AF37;">{payload.email}</a></td>
          </tr>
        </table>
        <hr style="border-color:#222; margin:20px 0;">
        <p style="color:#ccc; line-height:1.7; white-space:pre-wrap;">{payload.message}</p>
        <p style="color:#555; font-size:12px; margin-top:24px; border-top:1px solid #222; padding-top:12px;">
          Sent via xGPro Contact Form — <a href="https://xgpro.ai" style="color:#D4AF37;">xgpro.ai</a>
        </p>
      </div>
    </body>
    </html>
    """

    try:
        params: resend.Emails.SendParams = {
            "from": "xGPro Contact <onboarding@resend.dev>",
            "to": ["xgproai@gmail.com"],
            "reply_to": payload.email,
            "subject": f"[xGPro Contact] Message from {payload.name}",
            "html": html_body,
        }
        resend.Emails.send(params)
        return {"success": True, "message": "Message sent successfully!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
