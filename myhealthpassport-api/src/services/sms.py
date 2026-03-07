import requests

# --- Configuration (Keep these constants in one place) ---
API_KEY = "fef243824d578fe56221"
USERNAME = "Myhealth"
SENDER_ID = "MYHLTP"
API_URL = "https://smslogin.co/v3/api.php"


def send_sms(mobile_number, message, template_id):
    """
    Sends an SMS using the pre-configured API credentials.

    Args:
        mobile_number (str): The recipient's mobile number.
        message (str): The text message to send.
        template_id (str): The DLT template ID for the message.

    Returns:
        str: The MessageID from the API if successful, otherwise None.
    """
    params = {
        'username': USERNAME,
        'apikey': API_KEY,
        'senderid': SENDER_ID,
        'mobile': mobile_number,
        'message': message,
        'templateid': template_id
    }

    try:
        # Make the GET request to the API
        response = requests.get(API_URL, params=params)
        response.raise_for_status()  # Raise an error for bad responses (4xx or 5xx)

        # On success, print and return the MessageID
        print(f"Request successful. Status: {response.status_code}, Response: {response.text}")
        return response.text

    except requests.exceptions.RequestException as e:
        # On failure, print the error and return None
        print(f"An error occurred: {e}")
        return None


def send_otp_sms(recipient, otp_code):
    otp_message = f"Dear User, Your OTP for login to My health passport app is {otp_code}. Please do not share this OTP."
    otp_template_id = "1707175326692338253"
    message_id = send_sms(
        mobile_number=recipient,
        message=otp_message,
        template_id=otp_template_id
    )

    # 3. Check if it was successful
    if message_id:
        print(f"\nSMS sent! Message ID: {message_id}")
        return message_id
    else:
        print("\nFailed to send SMS.")
        return None
