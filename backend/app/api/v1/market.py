"""
Market Data API endpoints
Provides real-time crypto market data from Binance
"""

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from app.services.market_service import get_market_service
from app.services.historical_data_service import HistoricalDataService
from slowapi import Limiter
from slowapi.util import get_remote_address
import numpy as np


# Initialize limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()
historical_service = HistoricalDataService()


class MarketData(BaseModel):
    """Market data response model"""
    symbol: str
    price: float
    change_24h: float
    volume_24h: float
    high_24h: float
    low_24h: float
    timestamp: str
    _demo: Optional[bool] = None


class TechnicalIndicators(BaseModel):
    """Technical indicators model"""
    symbol: Optional[str] = None
    interval: Optional[str] = None
    rsi: float
    macd: float
    macd_signal: float
    macd_histogram: float
    bb_upper: float
    bb_middle: float
    bb_lower: float
    ema_20: float
    ema_50: float
    timestamp: Optional[str] = None
    _demo: Optional[bool] = None


class OrderBookAnalysis(BaseModel):
    """Order book analysis model"""
    symbol: Optional[str] = None
    bid_ask_ratio: float
    spread: float
    spread_pct: float
    total_bid_volume: float
    total_ask_volume: float
    large_orders: Dict[str, int]
    depth_strength: float
    timestamp: Optional[str] = None
    _demo: Optional[bool] = None


@router.get("/market/{symbol}/stats")
@limiter.limit("60/minute")  # 60 requests per minute for market data
async def get_market_stats(request: Request, symbol: str = "BTCUSDT"):
    """
    Get 24h ticker statistics from Binance

    Returns comprehensive 24h market statistics including:
    - Price change and percent change
    - Volume and quote volume
    - High and low prices
    - Weighted average price
    """
    try:
        import aiohttp

        url = f"https://api.binance.com/api/v3/ticker/24hr"
        params = {"symbol": symbol.upper()}

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()

                    return {
                        "symbol": data["symbol"],
                        "price_change": float(data["priceChange"]),
                        "price_change_percent": float(data["priceChangePercent"]),
                        "weighted_avg_price": float(data["weightedAvgPrice"]),
                        "last_price": float(data["lastPrice"]),
                        "volume": float(data["volume"]),
                        "quote_volume": float(data["quoteVolume"]),
                        "high_24h": float(data["highPrice"]),
                        "low_24h": float(data["lowPrice"]),
                        "open_price": float(data["openPrice"]),
                        "close_time": data["closeTime"],
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    raise HTTPException(status_code=response.status, detail="Binance API error")

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching market stats: {str(e)}"
        )


@router.get("/market/{symbol}", response_model=MarketData)
@limiter.limit("60/minute")  # 60 requests per minute
async def get_market_data(request: Request, symbol: str = "BTCUSDT"):
    """
    Get current market data for a symbol

    This endpoint fetches real-time data from Binance API.
    If Binance is unavailable, returns demo data.
    """
    try:
        market_service = get_market_service()
        data = await market_service.get_current_price(symbol.upper())
        return MarketData(**data)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching market data: {str(e)}"
        )


@router.get("/market/{symbol}/indicators", response_model=TechnicalIndicators)
@limiter.limit("60/minute")  # 60 requests per minute
async def get_technical_indicators(
    request: Request,
    symbol: str = "BTCUSDT",
    interval: str = "1h"
):
    """
    Get technical indicators for a symbol

    Calculates:
    - RSI (Relative Strength Index)
    - MACD (Moving Average Convergence Divergence)
    - Bollinger Bands
    - EMA (Exponential Moving Averages)

    Args:
        symbol: Trading pair (e.g., BTCUSDT)
        interval: Timeframe (1m, 5m, 15m, 1h, 4h, 1d)
    """
    try:
        market_service = get_market_service()
        indicators = await market_service.get_technical_indicators(
            symbol.upper(),
            interval
        )
        return TechnicalIndicators(**indicators)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating indicators: {str(e)}"
        )


@router.get("/market/{symbol}/orderbook", response_model=OrderBookAnalysis)
@limiter.limit("60/minute")  # 60 requests per minute
async def get_orderbook_analysis(request: Request, symbol: str = "BTCUSDT"):
    """
    Get orderbook analysis (your differentiator!)

    Analyzes:
    - Bid/Ask ratio (buying vs selling pressure)
    - Spread and spread percentage
    - Total bid/ask volumes
    - Large order detection
    - Market depth strength

    This is a key differentiating feature based on your
    trading exchange experience!
    """
    try:
        market_service = get_market_service()
        orderbook = await market_service.get_orderbook(symbol.upper())
        return OrderBookAnalysis(**orderbook)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing orderbook: {str(e)}"
        )


@router.get("/market/{symbol}/complete")
@limiter.limit("60/minute")  # 60 requests per minute
async def get_complete_market_data(request: Request, symbol: str = "BTCUSDT"):
    """
    Get complete market data including price, indicators, and orderbook

    This is a convenience endpoint that combines all market data
    in a single response for the AI to analyze.
    """
    try:
        market_service = get_market_service()

        # Fetch all data concurrently would be better, but for simplicity:
        price_data = await market_service.get_current_price(symbol.upper())
        indicators = await market_service.get_technical_indicators(symbol.upper())
        orderbook = await market_service.get_orderbook(symbol.upper())

        return {
            "symbol": symbol.upper(),
            "price": price_data,
            "indicators": indicators,
            "orderbook": orderbook,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching complete market data: {str(e)}"
        )


class HistoricalCandle(BaseModel):
    """Historical candle data model"""
    timestamp: int
    open: float
    high: float
    low: float
    close: float
    volume: float


@router.get("/market/history/{symbol}", response_model=List[HistoricalCandle])
async def get_historical_data(
    symbol: str,
    interval: str = Query(default="1h", description="Interval: 1m, 5m, 15m, 1h, 4h, 1d"),
    limit: int = Query(default=100, description="Number of candles to return")
):
    """
    Get historical K-line/candlestick data

    Args:
        symbol: Trading pair (e.g., BTCUSDT)
        interval: Timeframe (1m, 5m, 15m, 1h, 4h, 1d)
        limit: Number of candles (max 1000)

    Returns:
        List of historical candles with OHLCV data
    """
    try:
        # Calculate days needed based on interval and limit
        interval_hours = {
            '1m': 1/60, '5m': 5/60, '15m': 15/60,
            '1h': 1, '4h': 4, '1d': 24
        }
        hours_needed = limit * interval_hours.get(interval, 1)
        days_needed = max(1, int(hours_needed / 24) + 1)

        # Fetch historical data
        df = await historical_service.get_or_fetch_data(
            symbol=symbol,
            interval=interval,
            days=days_needed
        )

        # Take only the requested number of candles
        df = df.tail(limit)

        # Convert to list of candles
        candles = []
        for timestamp_idx, row in df.iterrows():
            # Convert timestamp (from index) to Unix milliseconds
            from datetime import datetime
            if isinstance(timestamp_idx, str):
                ts = int(datetime.strptime(timestamp_idx, '%Y-%m-%d %H:%M:%S').timestamp() * 1000)
            else:
                # Assume it's already a datetime object
                ts = int(timestamp_idx.timestamp() * 1000)

            candles.append(HistoricalCandle(
                timestamp=ts,
                open=float(row['open']),
                high=float(row['high']),
                low=float(row['low']),
                close=float(row['close']),
                volume=float(row['volume'])
            ))

        return candles

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching historical data: {str(e)}"
        )


@router.get("/market/indicators/{symbol}", response_model=TechnicalIndicators)
async def get_indicators(
    symbol: str,
    interval: str = Query(default="1h", description="Interval: 1m, 5m, 15m, 1h, 4h, 1d")
):
    """
    Get technical indicators for a symbol (alternative path)

    This endpoint provides the same functionality as /market/{symbol}/indicators
    but with a different URL structure for frontend compatibility.
    """
    try:
        market_service = get_market_service()
        indicators = await market_service.get_technical_indicators(
            symbol.upper(),
            interval
        )
        return TechnicalIndicators(**indicators)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating indicators: {str(e)}"
        )
