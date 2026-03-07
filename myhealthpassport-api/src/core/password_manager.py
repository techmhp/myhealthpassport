from argon2 import PasswordHasher, exceptions

# Initialize Argon2id password hasher
ph = PasswordHasher()


def create_password_hash(password: str) -> str:
    """Create an Argon2id hash for a given password."""
    return ph.hash(password)


def verify_password_hash(hash: str, password: str) -> bool:
    """Verify a password against the given Argon2id hash."""
    try:
        return ph.verify(hash, password)
    except exceptions.VerifyMismatchError:
        return False
