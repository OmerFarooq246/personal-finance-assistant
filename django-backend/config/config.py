from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    ORIGINS: list[str] = [
        "localhost",
        "127.0.0.1",
        "13.48.42.62",
        ".ngrok-free.app",
    ]
    ALLOWED_HOSTS: list[str] = [
        "http://localhost:3000",
        "https://personal-finance-assistant-gamma.vercel.app",
    ]
    PROJECT_NAME: str = "personal-finance-assistant-django"
    VERSION: str = "v1"
    DEBUG: bool = os.getenv("DEBUG", False)

    DB_NAME: str = os.getenv("DB_NAME", "")
    DB_USER: str = os.getenv("DB_USER", "")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_HOST: str = os.getenv("DB_HOST", "")
    DB_PORT: str = os.getenv("DB_PORT", "")

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "")

    CSV_BATCH_SIZE: int = os.getenv("CSV_BATCH_SIZE", 20)

    SECRET_KEY: str = os.getenv("SECRET_KEY", "django-insecure-development-key")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "")

config = Config()