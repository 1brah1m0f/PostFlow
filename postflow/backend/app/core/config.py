from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    UPLOADS_DIR: str = "./uploads"

    class Config:
        env_file = ".env"


settings = Settings()
