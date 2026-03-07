import random
import secrets
import string


def generate_transaction_number():
    """Generates a random 16-digit transaction number as a string."""
    transaction_number = "".join(random.choices(string.digits, k=16))
    return transaction_number


def generate_otp():
    """Generates a random 6-digit OTP as a string."""
    otp = "".join(random.choices(string.digits, k=6))
    return otp

def generate_user_code():
    characters = string.ascii_letters + string.digits  # Includes uppercase, lowercase letters, and digits
    username = ''.join(secrets.choice(characters) for _ in range(6))
    return username.upper()



