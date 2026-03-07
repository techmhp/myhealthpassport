import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# SMTP Configuration
# SMTP_SERVER = "ses-smtp-user.20250717-181535"  # Change region if needed
# SMTP_SERVER = "ses-smtp-user.20250717-181535.ap-south-1.amazonaws.com"  # Use correct region
SMTP_SERVER = "email-smtp.ap-south-1.amazonaws.com"


SMTP_PORT = 587  # Or 465 for SSL
SMTP_USERNAME = "AKIAXFKF2AB7QUR6VO5W"
SMTP_PASSWORD = "BC7cZR7KnYi8e8Jc1Iv8wlvtqM6w543J85c2XM1KtXOM"

# Email Content
SENDER = "no-reply@myhealthpassport.in"
RECIPIENT = "katla.jagadeesh@gmail.com"
SUBJECT = "Test Email from AWS SES via SMTP"
BODY_TEXT = "This is a test email sent using AWS SES SMTP with Python."

def send_email():
    # Create message
    msg = MIMEMultipart()
    msg['Subject'] = SUBJECT
    msg['From'] = SENDER
    msg['To'] = RECIPIENT

    # Add body to email
    body = MIMEText(BODY_TEXT, 'plain')
    msg.attach(body)

    try:
        # Connect to SMTP server and send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Secure the connection
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SENDER, RECIPIENT, msg.as_string())
        print("✅ Email sent successfully!")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
    finally:
        server.quit()

if __name__ == "__main__":
    send_email()

