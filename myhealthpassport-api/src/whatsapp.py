import httpx
from datetime import datetime

# Pinbot WhatsApp API Config
WHATSAPP_API_URL = "https://partnersv1.pinbot.ai/v3/324937767377144/messages"
WHATSAPP_API_KEY = "ec561fa7-2c7c-11ef-b1d4-02c8a5e042bd"  # Your actual key

async def send_whatsapp_notification(phone: str, template_name: str, image_url: str = None, body_params: list = None):
    """
    Send WhatsApp template message using Pinbot API
    """
    headers = {
        "Content-Type": "application/json",
        "apikey": WHATSAPP_API_KEY
    }

    components = []

    if image_url:
        components.append({
            "type": "header",
            "parameters": [{
                "type": "image",
                "image": {"link": image_url}
            }]
        })

    if body_params:
        components.append({
            "type": "body",
            "parameters": body_params
        })

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
            "components": components or [{}]
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(WHATSAPP_API_URL, json=payload, headers=headers)
            if response.status_code in (200, 201):
                print(f"WhatsApp sent successfully to {phone}")
            else:
                print(f"WhatsApp failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Failed to send WhatsApp: {str(e)}")