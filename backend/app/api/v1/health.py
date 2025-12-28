"""
Health check endpoints
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    Returns the current status of the API
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "CryptoSage AI Backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/health/live")
async def liveness():
    """
    Kubernetes liveness probe
    Simply checks if the app is running
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/ready")
async def readiness():
    """
    Kubernetes readiness probe
    Checks if all critical dependencies are ready
    """
    checks = {
        "api": True,
    }

    # Check Binance API connectivity
    try:
        from app.services.market_service import get_market_service
        market_service = get_market_service()
        await market_service.get_current_price("BTCUSDT")
        checks["binance_api"] = True
    except Exception as e:
        checks["binance_api"] = False
        checks["binance_error"] = str(e)[:100]  # Truncate error message

    # Check OpenAI API configuration
    try:
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your-new-openai-api-key-here":
            checks["openai_configured"] = False
            checks["openai_error"] = "API key not configured"
        else:
            # Just check if it's configured, don't make actual API call
            checks["openai_configured"] = True
    except Exception as e:
        checks["openai_configured"] = False
        checks["openai_error"] = str(e)[:100]

    # Determine overall readiness
    # Only Binance API is critical for basic functionality
    critical_checks = ["api", "binance_api"]
    all_critical_ready = all(checks.get(key, False) for key in critical_checks)

    status_code = 200 if all_critical_ready else 503

    return {
        "status": "ready" if all_critical_ready else "not_ready",
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }
