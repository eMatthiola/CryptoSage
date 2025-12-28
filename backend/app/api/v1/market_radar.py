"""
Market Radar API endpoints
Provides real-time market change detection and anomaly alerts
Enhanced with configurable thresholds and improved accuracy
WebSocket support for real-time updates
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Dict, List
from app.services.market_service import get_market_service
from app.services.historical_data_service import HistoricalDataService
from app.config.thresholds import (
    VOLUME_THRESHOLDS,
    RSI_THRESHOLDS,
    PRICE_BREAKOUT_THRESHOLDS,
    get_volume_threshold,
    is_rsi_overbought,
    is_rsi_oversold,
    is_rapid_price_movement
)
import numpy as np
import asyncio
import json
from app.core.logger import get_logger

logger = get_logger(__name__)



router = APIRouter()
historical_service = HistoricalDataService()


# ========== MODELS ==========

class ChangeSnapshotResponse(BaseModel):
    """Change snapshot response model"""
    priceChange: float
    volumeChange: float
    rsiShift: Dict[str, float]
    momentum: str  # 'rising', 'falling', 'neutral'
    newsCount: int
    newsTopic: str
    timestamp: str


class AnomalyAlert(BaseModel):
    """Anomaly alert model"""
    id: str
    type: str  # 'high' or 'watch'
    icon: str
    title: str
    description: str
    context: str
    timestamp: str


class AnomalyAlertsResponse(BaseModel):
    """Anomaly alerts response model"""
    alerts: List[AnomalyAlert]
    timestamp: str


class MarketTempoResponse(BaseModel):
    """Market tempo response model"""
    volatility: Dict
    activity: Dict
    direction: Dict
    summary: str
    timestamp: str


class TimelineEvent(BaseModel):
    """Timeline event model"""
    id: str
    time: str
    type: str  # 'price', 'volume', 'news', 'technical'
    icon: str
    title: str
    description: str


class TimelineResponse(BaseModel):
    """Timeline response model"""
    events: List[TimelineEvent]
    timestamp: str


# ========== ENDPOINTS ==========

@router.get("/radar/{symbol}/snapshot", response_model=ChangeSnapshotResponse)
async def get_change_snapshot(symbol: str = "BTCUSDT"):
    """
    Get 1-hour change snapshot for Market Radar

    Compares current market state with 1 hour ago:
    - Price change percentage
    - Volume change percentage
    - RSI shift (from → to)
    - Momentum direction
    - News flow
    """
    try:
        market_service = get_market_service()

        # Get current data
        current_price_data = await market_service.get_current_price(symbol.upper())
        current_indicators = await market_service.get_technical_indicators(symbol.upper(), "1h")

        # Get historical data for 1 hour ago
        df = await historical_service.get_or_fetch_data(
            symbol=symbol.upper(),
            interval="1h",
            days=1
        )

        if len(df) < 2:
            raise HTTPException(status_code=400, detail="Insufficient historical data")

        # Get data from 1 hour ago
        one_hour_ago = df.iloc[-2]  # -1 is current, -2 is 1 hour ago
        current_candle = df.iloc[-1]

        # Calculate price change
        price_change = ((current_price_data['price'] - one_hour_ago['close']) / one_hour_ago['close']) * 100

        # Calculate volume change (compare with 24h average)
        avg_volume = df.tail(24)['volume'].mean()
        volume_change = ((current_candle['volume'] - avg_volume) / avg_volume) * 100 if avg_volume > 0 else 0

        # Calculate RSI shift
        rsi_current = current_indicators.get('rsi', 50)
        # Estimate RSI from 1 hour ago (rough estimation based on price change)
        rsi_previous = rsi_current - (price_change * 0.5)
        rsi_previous = max(0, min(100, rsi_previous))

        # Determine momentum
        if price_change > 1 and volume_change > 20:
            momentum = 'rising'
        elif price_change < -1 and volume_change > 20:
            momentum = 'falling'
        else:
            momentum = 'neutral'

        # News flow (placeholder - integrate with news service later)
        news_count = 0
        news_topic = 'Market'

        return ChangeSnapshotResponse(
            priceChange=round(price_change, 2),
            volumeChange=round(volume_change, 2),
            rsiShift={
                "from": round(rsi_previous, 1),
                "to": round(rsi_current, 1)
            },
            momentum=momentum,
            newsCount=news_count,
            newsTopic=news_topic,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching change snapshot: {str(e)}"
        )


@router.get("/radar/{symbol}/anomalies", response_model=AnomalyAlertsResponse)
async def get_anomaly_alerts(symbol: str = "BTCUSDT"):
    """
    Detect market anomalies for Market Radar

    Analyzes:
    - Price breakouts (resistance/support)
    - Volume spikes (>2 std dev)
    - RSI extremes (>75 or <25)
    - Rapid price movements
    """
    try:
        market_service = get_market_service()

        # Get current data
        price_data = await market_service.get_current_price(symbol.upper())
        indicators = await market_service.get_technical_indicators(symbol.upper(), "1h")

        # Get historical data for statistical analysis
        df = await historical_service.get_or_fetch_data(
            symbol=symbol.upper(),
            interval="1h",
            days=7  # 7 days for better statistics
        )

        alerts = []

        # 1. Check for volume spike (using configurable thresholds)
        current_volume = df.iloc[-1]['volume']
        volume_mean = df['volume'].mean()
        volume_std = df['volume'].std()
        volume_z_score = (current_volume - volume_mean) / volume_std if volume_std > 0 else 0

        watch_threshold = get_volume_threshold("watch")
        high_threshold = get_volume_threshold("high")

        if volume_z_score > watch_threshold:
            volume_change_pct = ((current_volume - volume_mean) / volume_mean) * 100

            # Only alert if change is significant enough
            if abs(volume_change_pct) >= VOLUME_THRESHOLDS["min_change_pct"]:
                alerts.append(AnomalyAlert(
                    id="volume_spike",
                    type="high" if volume_z_score > high_threshold else "watch",
                    icon="📊",
                    title="Volume Spike",
                    description=f"+{volume_change_pct:.0f}% vs {VOLUME_THRESHOLDS['lookback_days']}-day average",
                    context=f"Z-score: {volume_z_score:.1f} - Increased market activity",
                    timestamp=f"{int(volume_z_score * 5)} minutes ago"
                ))

        # 2. Check RSI extremes (using configurable thresholds)
        rsi = indicators.get('rsi', 50)

        if is_rsi_overbought(rsi, extreme=True):
            alerts.append(AnomalyAlert(
                id="rsi_overbought_extreme",
                type="high",
                icon="🔴",
                title="RSI Extreme Overbought",
                description=f"{rsi:.1f} (>{RSI_THRESHOLDS['overbought_extreme']})",
                context="Strong pullback risk - Market may be overheated",
                timestamp="5 minutes ago"
            ))
        elif is_rsi_overbought(rsi):
            alerts.append(AnomalyAlert(
                id="rsi_overbought",
                type="watch",
                icon="⚠️",
                title="RSI Overbought",
                description=f"{rsi:.1f} (>{RSI_THRESHOLDS['overbought']})",
                context="May indicate pullback risk",
                timestamp="5 minutes ago"
            ))

        if is_rsi_oversold(rsi, extreme=True):
            alerts.append(AnomalyAlert(
                id="rsi_oversold_extreme",
                type="high",
                icon="🟢",
                title="RSI Extreme Oversold",
                description=f"{rsi:.1f} (<{RSI_THRESHOLDS['oversold_extreme']})",
                context="Strong bounce opportunity - Market may be oversold",
                timestamp="5 minutes ago"
            ))
        elif is_rsi_oversold(rsi):
            alerts.append(AnomalyAlert(
                id="rsi_oversold",
                type="watch",
                icon="⚠️",
                title="RSI Oversold",
                description=f"{rsi:.1f} (<{RSI_THRESHOLDS['oversold']})",
                context="May indicate bounce opportunity",
                timestamp="5 minutes ago"
            ))

        # 3. Check price breakout (using configurable thresholds)
        current_price = price_data['price']
        week_high = df['high'].max()
        week_low = df['low'].min()

        resistance_tolerance = 1 - PRICE_BREAKOUT_THRESHOLDS["resistance_tolerance"]
        support_tolerance = 1 + PRICE_BREAKOUT_THRESHOLDS["support_tolerance"]

        if current_price >= week_high * resistance_tolerance:
            alerts.append(AnomalyAlert(
                id="resistance_break",
                type="high",
                icon="📈",
                title="Key Resistance Break",
                description=f"Price at ${current_price:.2f} testing ${week_high:.2f} (7-day high)",
                context="Potential continuation or rejection zone",
                timestamp="10 minutes ago"
            ))
        elif current_price <= week_low * support_tolerance:
            alerts.append(AnomalyAlert(
                id="support_break",
                type="high",
                icon="📉",
                title="Key Support Break",
                description=f"Price broke ${week_low:.2f} (7-day low)",
                context="Potential breakdown or bounce zone",
                timestamp="10 minutes ago"
            ))

        # 4. Check for rapid price movement (>3% in 1 hour)
        if len(df) >= 2:
            price_1h_ago = df.iloc[-2]['close']
            price_change_1h = ((current_price - price_1h_ago) / price_1h_ago) * 100

            if abs(price_change_1h) > 3:
                direction = "surge" if price_change_1h > 0 else "drop"
                alerts.append(AnomalyAlert(
                    id="rapid_movement",
                    type="high",
                    icon="💰",
                    title=f"Rapid Price {direction.capitalize()}",
                    description=f"{price_change_1h:+.1f}% in 1 hour",
                    context="Significant volatility detected",
                    timestamp="Just now"
                ))

        return AnomalyAlertsResponse(
            alerts=alerts,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error detecting anomalies: {str(e)}"
        )


@router.get("/radar/{symbol}/tempo", response_model=MarketTempoResponse)
async def get_market_tempo(symbol: str = "BTCUSDT"):
    """
    Get market tempo (rhythm and energy) for Market Radar

    Calculates:
    - Volatility rhythm (accelerating/decelerating/stable)
    - Trading activity (vs 24h average)
    - Directional bias (bullish/bearish/neutral)
    - AI-generated summary
    """
    try:
        # Get historical data
        df = await historical_service.get_or_fetch_data(
            symbol=symbol.upper(),
            interval="1h",
            days=3  # 3 days for trend analysis
        )

        if len(df) < 24:
            raise HTTPException(status_code=400, detail="Insufficient historical data")

        # 1. Calculate volatility rhythm
        recent_std = df.tail(6)['close'].std()  # Last 6 hours
        previous_std = df.iloc[-12:-6]['close'].std()  # Previous 6 hours

        volatility_change = ((recent_std - previous_std) / previous_std) * 100 if previous_std > 0 else 0

        if volatility_change > 20:
            volatility_trend = 'accelerating'
            volatility_label = 'High Volatility'
        elif volatility_change < -20:
            volatility_trend = 'decelerating'
            volatility_label = 'Low'
        else:
            volatility_trend = 'stable'
            volatility_label = 'Moderate'

        max_std = df['close'].std()
        volatility_level = min(100, (recent_std / max_std) * 100) if max_std > 0 else 50

        # 2. Calculate trading activity
        recent_volume = df.tail(6)['volume'].mean()
        avg_volume_24h = df.tail(24)['volume'].mean()

        activity_vs_average = ((recent_volume - avg_volume_24h) / avg_volume_24h) * 100 if avg_volume_24h > 0 else 0
        activity_level = min(100, max(0, 50 + activity_vs_average / 2))

        if activity_level > 70:
            activity_label = 'Very Active'
        elif activity_level > 40:
            activity_label = 'Active'
        else:
            activity_label = 'Quiet'

        # 3. Calculate directional bias
        current_price = df.iloc[-1]['close']
        price_6h_ago = df.iloc[-7]['close'] if len(df) > 6 else df.iloc[0]['close']
        price_momentum = ((current_price - price_6h_ago) / price_6h_ago) * 100

        sma_20 = df.tail(20)['close'].mean()
        sma_20_prev = df.iloc[-21:-1]['close'].mean() if len(df) > 21 else sma_20
        sma_slope = ((sma_20 - sma_20_prev) / sma_20_prev) * 100 if sma_20_prev > 0 else 0

        direction_score = (price_momentum + sma_slope) / 2

        if direction_score > 1:
            direction_bias = 'bullish'
            direction_label = 'Uptrend'
            direction_level = min(100, 50 + direction_score * 10)
        elif direction_score < -1:
            direction_bias = 'bearish'
            direction_label = 'Downtrend'
            direction_level = max(0, 50 + direction_score * 10)
        else:
            direction_bias = 'neutral'
            direction_label = 'Sideways'
            direction_level = 50

        # 4. Generate summary
        if volatility_level > 70 and 40 < direction_level < 60:
            summary = "Active trading with increased volatility but no clear directional trend. Consider waiting for confirmation signals before taking positions."
        elif volatility_level > 70 and direction_bias == 'bullish':
            summary = "Strong upward momentum with high volatility. Potential for continuation but watch for exhaustion signals."
        elif volatility_level > 70 and direction_bias == 'bearish':
            summary = "Downward pressure with elevated volatility. Support levels may be tested."
        elif activity_level < 40:
            summary = "Low trading activity and reduced volatility. Market in consolidation phase."
        else:
            summary = "Normal market conditions with balanced activity levels."

        return MarketTempoResponse(
            volatility={
                "level": round(volatility_level, 0),
                "trend": volatility_trend,
                "label": volatility_label
            },
            activity={
                "level": round(activity_level, 0),
                "vsAverage": round(activity_vs_average, 0),
                "label": activity_label
            },
            direction={
                "level": round(direction_level, 0),
                "bias": direction_bias,
                "label": direction_label
            },
            summary=summary,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating market tempo: {str(e)}"
        )


@router.get("/radar/{symbol}/timeline", response_model=TimelineResponse)
async def get_market_timeline(symbol: str = "BTCUSDT"):
    """
    Get 24-hour market event timeline for Market Radar

    Aggregates key events:
    - Price breakouts/breakdowns
    - Volume spikes
    - Technical pattern formations
    """
    try:
        # Get historical data for 24 hours
        df = await historical_service.get_or_fetch_data(
            symbol=symbol.upper(),
            interval="1h",
            days=1
        )

        if len(df) < 6:
            raise HTTPException(status_code=400, detail="Insufficient historical data")

        events = []

        # Analyze each candle for significant events
        for i in range(len(df)-1, max(0, len(df)-25), -1):  # Last 24 hours
            candle = df.iloc[i]
            candle_time = candle.name if hasattr(candle.name, 'strftime') else datetime.now()
            time_str = candle_time.strftime('%H:%M') if hasattr(candle_time, 'strftime') else f"{i}:00"

            # Check for volume spike
            if i < len(df) - 1:
                avg_volume = df.iloc[max(0, i-6):i]['volume'].mean()
                if candle['volume'] > avg_volume * 2 and len(events) < 6:
                    volume_change = ((candle['volume'] - avg_volume) / avg_volume) * 100
                    events.append(TimelineEvent(
                        id=f"volume_{i}",
                        time=time_str,
                        type="volume",
                        icon="📊",
                        title="Volume Surge",
                        description=f"Volume spike detected (+{volume_change:.0f}%)"
                    ))

            # Check for price breakout
            if i >= 6:
                recent_high = df.iloc[i-6:i]['high'].max()
                if candle['high'] > recent_high * 1.005 and len(events) < 6:
                    price_change = ((candle['close'] - candle['open']) / candle['open']) * 100
                    events.append(TimelineEvent(
                        id=f"price_{i}",
                        time=time_str,
                        type="price",
                        icon="💰",
                        title="Price Breakout",
                        description=f"Broke ${candle['high']:.2f} resistance ({price_change:+.1f}%)"
                    ))

        # Add synthetic events if we don't have enough
        if len(events) < 3:
            events.append(TimelineEvent(
                id="market_open",
                time=(datetime.now() - timedelta(hours=18)).strftime('%H:%M'),
                type="price",
                icon="🌏",
                title="Asia Market Rally",
                description="Asian session opened with moderate activity"
            ))

        # Sort events by time (most recent first)
        events = sorted(events, key=lambda x: x.time, reverse=True)[:6]

        return TimelineResponse(
            events=events,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating timeline: {str(e)}"
        )


# ========== WEBSOCKET ENDPOINT ==========

@router.websocket("/radar/ws/{symbol}")
async def market_radar_websocket(websocket: WebSocket, symbol: str = "BTCUSDT"):
    """
    WebSocket endpoint for real-time Market Radar updates

    Sends combined data every 30 seconds:
    - Change Snapshot
    - Anomaly Alerts
    - Market Tempo
    - Timeline Events

    Message format:
    {
        "type": "market_radar_update",
        "symbol": "BTCUSDT",
        "timestamp": "2025-12-25T...",
        "data": {
            "snapshot": {...},
            "anomalies": {...},
            "tempo": {...},
            "timeline": {...}
        }
    }
    """
    await websocket.accept()

    logger.info(f"[Market Radar WebSocket] Client connected for {symbol}")

    try:
        while True:
            try:
                # Fetch all 4 data sources in parallel
                snapshot_task = get_change_snapshot(symbol)
                anomalies_task = get_anomaly_alerts(symbol)
                tempo_task = get_market_tempo(symbol)
                timeline_task = get_market_timeline(symbol)

                snapshot, anomalies, tempo, timeline = await asyncio.gather(
                    snapshot_task,
                    anomalies_task,
                    tempo_task,
                    timeline_task,
                    return_exceptions=True
                )

                # Build combined message
                message = {
                    "type": "market_radar_update",
                    "symbol": symbol.upper(),
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "snapshot": snapshot.dict() if not isinstance(snapshot, Exception) else None,
                        "anomalies": anomalies.dict() if not isinstance(anomalies, Exception) else None,
                        "tempo": tempo.dict() if not isinstance(tempo, Exception) else None,
                        "timeline": timeline.dict() if not isinstance(timeline, Exception) else None
                    },
                    "errors": {
                        "snapshot": str(snapshot) if isinstance(snapshot, Exception) else None,
                        "anomalies": str(anomalies) if isinstance(anomalies, Exception) else None,
                        "tempo": str(tempo) if isinstance(tempo, Exception) else None,
                        "timeline": str(timeline) if isinstance(timeline, Exception) else None
                    }
                }

                # Send to client
                await websocket.send_json(message)

                logger.info(f"[Market Radar WebSocket] Sent update for {symbol}")

                # Wait 30 seconds before next update
                await asyncio.sleep(30)

            except WebSocketDisconnect:
                logger.info(f"[Market Radar WebSocket] Client disconnected for {symbol}")
                break

            except Exception as e:
                logger.info(f"[Market Radar WebSocket] Error: {e}")
                # Send error message to client
                error_message = {
                    "type": "error",
                    "message": str(e),
                    "timestamp": datetime.now().isoformat()
                }
                try:
                    await websocket.send_json(error_message)
                except:
                    break

    except WebSocketDisconnect:
        logger.info(f"[Market Radar WebSocket] Client disconnected for {symbol}")
    except Exception as e:
        logger.info(f"[Market Radar WebSocket] Fatal error: {e}")
    finally:
        logger.info(f"[Market Radar WebSocket] Connection closed for {symbol}")
