from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Roundtable Backend"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "sqlite:///./roundtable.db"
    JWT_SECRET: str = "roundtable-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:5173"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
