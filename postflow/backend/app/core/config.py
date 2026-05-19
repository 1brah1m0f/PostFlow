from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    FERNET_KEY: str
    UPLOADS_DIR: str = "./uploads"

    class Config:
        env_file = ".env"


settings = Settings()
