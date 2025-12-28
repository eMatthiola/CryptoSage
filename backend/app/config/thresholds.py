"""
Market Radar Detection Thresholds Configuration
Centralized configuration for anomaly detection sensitivity
"""

# Volume Anomaly Detection
VOLUME_THRESHOLDS = {
    "z_score_watch": 2.0,      # Z-score threshold for "watch" level alert
    "z_score_high": 3.0,        # Z-score threshold for "high" level alert
    "min_change_pct": 50.0,     # Minimum percentage change to report (avoid noise)
    "lookback_days": 7,         # Days of historical data for statistical analysis
}

# RSI Thresholds
RSI_THRESHOLDS = {
    "overbought": 70,           # Standard overbought level (was 75, too extreme)
    "overbought_extreme": 80,   # Extreme overbought (very rare)
    "oversold": 30,             # Standard oversold level (was 25, too extreme)
    "oversold_extreme": 20,     # Extreme oversold (very rare)
    "neutral_upper": 55,        # Upper bound of neutral zone
    "neutral_lower": 45,        # Lower bound of neutral zone
}

# Price Breakout Detection
PRICE_BREAKOUT_THRESHOLDS = {
    "resistance_tolerance": 0.002,  # 0.2% tolerance for resistance break (was 0.1%, too tight)
    "support_tolerance": 0.002,     # 0.2% tolerance for support break
    "lookback_days": 7,             # Days to determine key levels
    "confirmation_period_min": 5,   # Minutes to confirm breakout
}

# Price Movement (Rapid Changes)
PRICE_MOVEMENT_THRESHOLDS = {
    "rapid_rise_1h": 3.0,       # % change in 1 hour to trigger rapid rise alert
    "rapid_fall_1h": -3.0,      # % change in 1 hour to trigger rapid fall alert
    "extreme_rise_1h": 5.0,     # Extreme rise (higher severity)
    "extreme_fall_1h": -5.0,    # Extreme fall (higher severity)
}

# MACD Divergence
MACD_THRESHOLDS = {
    "strong_bullish": 0.5,      # Strong bullish signal
    "strong_bearish": -0.5,     # Strong bearish signal
    "histogram_threshold": 0.1, # Minimum histogram value to consider
}

# Market Tempo Thresholds
MARKET_TEMPO_THRESHOLDS = {
    # Volatility levels (based on 7-day rolling std dev)
    "volatility_low": 1.0,      # Below this = low volatility
    "volatility_medium": 2.5,   # Below this = medium volatility
    "volatility_high": 4.0,     # Above this = high volatility

    # Activity levels (volume percentile)
    "activity_quiet": 30,       # Below 30th percentile = quiet
    "activity_moderate": 70,    # 30-70th percentile = moderate
    "activity_active": 70,      # Above 70th percentile = active

    # Directional bias (price change %)
    "direction_up_threshold": 1.0,    # > +1% = uptrend
    "direction_down_threshold": -1.0, # < -1% = downtrend
}

# Change Snapshot Sensitivity
SNAPSHOT_THRESHOLDS = {
    "significant_price_change": 2.0,    # % change to be considered significant
    "significant_volume_change": 50.0,  # % change to be considered significant
    "significant_rsi_shift": 10,        # RSI point shift to be significant
}

# Time Windows for Multi-Timeframe Analysis
TIME_WINDOWS = {
    "5m": {"minutes": 5, "label": "5min"},
    "15m": {"minutes": 15, "label": "15min"},
    "1h": {"minutes": 60, "label": "1h"},
    "4h": {"minutes": 240, "label": "4h"},
    "24h": {"minutes": 1440, "label": "24h"},
}

# Alert Deduplication
ALERT_DEDUPLICATION = {
    "min_time_between_same_alert_sec": 300,  # 5 minutes between same type of alert
    "max_concurrent_alerts": 5,              # Maximum alerts to show at once
}


def get_volume_threshold(severity_level: str = "watch") -> float:
    """Get volume anomaly z-score threshold"""
    return VOLUME_THRESHOLDS.get(f"z_score_{severity_level}", 2.0)


def is_rsi_overbought(rsi: float, extreme: bool = False) -> bool:
    """Check if RSI is in overbought zone"""
    threshold = RSI_THRESHOLDS["overbought_extreme"] if extreme else RSI_THRESHOLDS["overbought"]
    return rsi > threshold


def is_rsi_oversold(rsi: float, extreme: bool = False) -> bool:
    """Check if RSI is in oversold zone"""
    threshold = RSI_THRESHOLDS["oversold_extreme"] if extreme else RSI_THRESHOLDS["oversold"]
    return rsi < threshold


def is_rapid_price_movement(price_change_pct: float) -> tuple[bool, str]:
    """
    Check if price movement is rapid

    Returns:
        (is_rapid, severity) where severity is 'normal', 'rapid', or 'extreme'
    """
    if price_change_pct >= PRICE_MOVEMENT_THRESHOLDS["extreme_rise_1h"]:
        return True, "extreme_rise"
    elif price_change_pct <= PRICE_MOVEMENT_THRESHOLDS["extreme_fall_1h"]:
        return True, "extreme_fall"
    elif price_change_pct >= PRICE_MOVEMENT_THRESHOLDS["rapid_rise_1h"]:
        return True, "rapid_rise"
    elif price_change_pct <= PRICE_MOVEMENT_THRESHOLDS["rapid_fall_1h"]:
        return True, "rapid_fall"
    else:
        return False, "normal"


def get_volatility_level(volatility_pct: float) -> str:
    """Categorize volatility level"""
    if volatility_pct < MARKET_TEMPO_THRESHOLDS["volatility_low"]:
        return "Low"
    elif volatility_pct < MARKET_TEMPO_THRESHOLDS["volatility_medium"]:
        return "Medium"
    elif volatility_pct < MARKET_TEMPO_THRESHOLDS["volatility_high"]:
        return "High"
    else:
        return "Extreme"


def get_activity_level(volume_percentile: float) -> str:
    """Categorize market activity level"""
    if volume_percentile < MARKET_TEMPO_THRESHOLDS["activity_quiet"]:
        return "Quiet"
    elif volume_percentile < MARKET_TEMPO_THRESHOLDS["activity_moderate"]:
        return "Moderate"
    else:
        return "Active"
