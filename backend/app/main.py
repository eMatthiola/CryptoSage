"""
CryptoSage AI - FastAPI Backend
Main application entry point
"""

import asyncio
import psutil
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.api.v1 import chat, health, market, news, market_radar
from app.core.logger import get_logger

logger = get_logger(__name__)

# Memory monitoring task
_memory_monitor_task = None

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


async def monitor_memory():
    """
    Background task to monitor memory usage
    Logs memory statistics every 10 minutes for optimization tracking
    """
    process = psutil.Process(os.getpid())

    while True:
        try:
            mem = process.memory_info()
            mem_mb = mem.rss / 1024 / 1024
            mem_percent = process.memory_percent()

            logger.info(f"[Memory Monitor] RSS: {mem_mb:.1f} MB ({mem_percent:.1f}%)")

            # Log cache statistics if available
            try:
                from app.services.historical_data_service import get_historical_data_service
                hist_service = get_historical_data_service()
                cache_stats = hist_service.get_cache_stats()
                logger.info(f"[Memory Monitor] Historical Cache: {cache_stats['size']}/{cache_stats['maxsize']} entries")
            except Exception as e:
                logger.debug(f"[Memory Monitor] Could not get cache stats: {e}")

            # Wait 10 minutes before next check
            await asyncio.sleep(600)

        except asyncio.CancelledError:
            logger.info("[Memory Monitor] Monitoring stopped")
            break
        except Exception as e:
            logger.error(f"[Memory Monitor] Error: {e}")
            await asyncio.sleep(600)


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
    global _memory_monitor_task

    logger.info(f">> Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f">> API Documentation: http://localhost:8000/docs")
    logger.info(f">> Environment: {settings.ENVIRONMENT}")

    # Start memory monitoring
    try:
        _memory_monitor_task = asyncio.create_task(monitor_memory())
        logger.info(f">> Started memory monitoring (logs every 10 minutes)")
    except Exception as e:
        logger.info(f">> Warning: Could not start memory monitor: {e}")

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
    global _memory_monitor_task

    logger.info(f">> Shutting down {settings.PROJECT_NAME}")

    # Stop memory monitor
    try:
        if _memory_monitor_task:
            _memory_monitor_task.cancel()
            await _memory_monitor_task
            logger.info(f">> Stopped memory monitor")
    except Exception as e:
        logger.info(f">> Warning: Could not stop memory monitor: {e}")

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
