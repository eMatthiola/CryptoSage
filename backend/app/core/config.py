"""
Application configuration
Loaded from environment variables
"""

from typing import List
from pydantic_settings import BaseSettings
from app.core.logger import get_logger

logger = get_logger(__name__)



class Settings(BaseSettings):
    """Application settings"""

    # Project Info
    PROJECT_NAME: str = "CryptoSage AI"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # API Configuration
    API_V1_PREFIX: str = "/api/v1"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # Database
    DATABASE_URL: str = "sqlite:///./cryptosage.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""  # For Qdrant Cloud

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Binance
    BINANCE_API_KEY: str = ""
    BINANCE_SECRET_KEY: str = ""

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # Rate Limiting
    DAILY_REQUEST_LIMIT: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True

    def validate_production(self):
        """
        Validate production environment configuration
        Raises ValueError if critical settings are missing or insecure
        """
        if self.ENVIRONMENT == "production":
            # Check SECRET_KEY
            if self.SECRET_KEY == "your-secret-key-change-in-production":
                raise ValueError(
                    "Production environment must have a strong SECRET_KEY. "
                    "Generate one with: python -c 'import secrets; logger.info(secrets.token_urlsafe(32))'"
                )

            if len(self.SECRET_KEY) < 32:
                raise ValueError(
                    f"SECRET_KEY must be at least 32 characters long. "
                    f"Current length: {len(self.SECRET_KEY)}"
                )

            # Check OpenAI API Key
            if not self.OPENAI_API_KEY:
                raise ValueError(
                    "Production environment must have OPENAI_API_KEY configured. "
                    "Get your key from: https://platform.openai.com/api-keys"
                )

            if self.OPENAI_API_KEY == "your-new-openai-api-key-here":
                raise ValueError(
                    "OPENAI_API_KEY must be replaced with a valid API key"
                )

            # Check DEBUG is disabled
            if self.DEBUG:
                raise ValueError(
                    "Production environment must have DEBUG=false"
                )

            # Check CORS origins are specific
            if "*" in self.CORS_ORIGINS:
                raise ValueError(
                    "Production environment must not use wildcard (*) in CORS_ORIGINS. "
                    "Specify exact domains instead."
                )

            logger.info("✅ Production configuration validation passed")

        return True


# Create settings instance
settings = Settings()

# Validate on startup if in production
if settings.ENVIRONMENT == "production":
    settings.validate_production()
