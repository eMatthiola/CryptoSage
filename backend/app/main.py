"""
CryptoSage AI - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.api.v1 import chat, health, market, news, market_radar
from app.core.logger import get_logger

logger = get_logger(__name__)

# Create rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-time Crypto Market Intelligence & News Aggregation Platform",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - Secure configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicit methods only
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Requested-With",
    ],  # Explicit headers only
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])
app.include_router(market.router, prefix="/api/v1", tags=["Market"])
app.include_router(market_radar.router, prefix="/api/v1/market", tags=["Market Radar"])
app.include_router(news.router, prefix="/api/v1", tags=["News & RAG"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to CryptoSage AI",
        "version": settings.VERSION,
        "docs": "/docs",
    }


@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info(f">> Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f">> API Documentation: http://localhost:8000/docs")
    logger.info(f">> Environment: {settings.ENVIRONMENT}")

    # Start scheduler for periodic tasks
    try:
        from app.services.scheduler_service import get_scheduler_service
        scheduler = get_scheduler_service()
        scheduler.start()
    except Exception as e:
        logger.info(f">> Warning: Could not start scheduler: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info(f">> Shutting down {settings.PROJECT_NAME}")

    # Stop scheduler
    try:
        from app.services.scheduler_service import get_scheduler_service
        scheduler = get_scheduler_service()
        scheduler.stop()
    except Exception as e:
        logger.info(f">> Warning: Could not stop scheduler: {e}")

    # Close historical data service session
    try:
        from app.services.historical_data_service import get_historical_data_service
        historical_service = get_historical_data_service()
        await historical_service.close()
        logger.info(f">> Closed historical data service session")
    except Exception as e:
        logger.info(f">> Warning: Could not close historical data service: {e}")

    # Close HTTP session from market API
    try:
        from app.api.v1 import market
        if market._http_session and not market._http_session.closed:
            await market._http_session.close()
            logger.info(f">> Closed market API HTTP session")
    except Exception as e:
        logger.info(f">> Warning: Could not close market API HTTP session: {e}")

    # Close market service session
    try:
        from app.services.market_service import get_market_service
        market_service = get_market_service()
        await market_service.close()
        logger.info(f">> Closed market service session")
    except Exception as e:
        logger.info(f">> Warning: Could not close market service: {e}")
