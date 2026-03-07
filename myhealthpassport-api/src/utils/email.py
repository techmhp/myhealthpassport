import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)

## testing
# SMTP_HOST = 'smtp.gmail.com'
# SMTP_PORT = 587
# EMAIL_USE_TLS = True
# SMTP_USERNAME = 'tskgadini@gmail.com'
# SMTP_PASSWORD = 'xxxx' 
# FROM_EMAIL = 'tskgadini@gmail.com'

def _send_email_sync(subject: str, recipient: str, html_body: str, plain_body: str = None):
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = FROM_EMAIL
        msg["To"] = recipient
        msg["Subject"] = subject

        # Plain text fallback
        if plain_body:
            msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, recipient, msg.as_string())

        logger.info(f"Email sent to {recipient} with subject: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {recipient}: {e}")
        raise e


async def send_reset_email(subject: str, recipient: str, html_body: str, plain_body: str = None):
    await run_in_threadpool(_send_email_sync, subject, recipient, html_body, plain_body)
