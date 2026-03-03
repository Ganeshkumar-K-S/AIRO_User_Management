import random
from datetime import datetime, timedelta
from app.db.connection import db

def generate_otp():
    return str(random.randint(100000, 999999))

async def create_otp(email):
    otp = generate_otp()

    await db.otp_store.delete_many({"email": email})

    await db.otp_store.insert_one({
        "email": email,
        "otp": otp,
        "verified": False,
        "expires_at": datetime.now() + timedelta(minutes=5)
    })

    return otp


async def verify_otp(email, otp):
    record = await db.otp_store.find_one({"email": email})

    if not record:
        return False

    if record["expires_at"] < datetime.now():
        return False

    if record["otp"] != otp:
        return False

    await db.otp_store.update_one(
        {"email": email},
        {"$set": {"verified": True}}
    )

    return True

# from fastapi_mail import FastMail, MessageSchema
# from app.core.config import settings

# async def send_otp_email(email: str, otp: str):

#     message = MessageSchema(
#         subject="Your OTP Code",
#         recipients=[email],
#         body=f"Your OTP is {otp}. It expires in 5 minutes.",
#         subtype="plain"
#     )

#     fm = FastMail(settings.mail_conf)
#     await fm.send_message(message)

import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

async def send_otp_email(email: str, otp: str):

    api_key = os.getenv("SENDGRID_API_KEY")
    mail_from = os.getenv("MAIL_FROM")

    print("SENDGRID KEY:", api_key)
    print("MAIL_FROM:", mail_from)

    message = Mail(
        from_email=mail_from,
        to_emails=email,
        subject="Your OTP Code",
        plain_text_content=f"Your OTP is {otp}. It expires in 5 minutes."
    )

    try:
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)

        print("SendGrid Status Code:", response.status_code)
        print("SendGrid Response Body:", response.body)
        print("SendGrid Headers:", response.headers)

    except Exception as e:
        print("SendGrid error:", str(e))