from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings


def _get_fernet() -> Fernet:
    if not settings.ENCRYPTION_KEY:
        raise RuntimeError(
            "ENCRYPTION_KEY is not set. "
            "Generate with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    key = settings.ENCRYPTION_KEY
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_password(plaintext: str) -> str:
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt_password(ciphertext: str) -> str:
    try:
        return _get_fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        raise ValueError("Credential decryption failed — ENCRYPTION_KEY may have changed")
