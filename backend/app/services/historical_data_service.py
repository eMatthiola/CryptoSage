"""
Historical Data Service
Collects and manages historical price data from Binance API
Enhanced with in-memory caching for improved performance
"""

import asyncio
import aiohttp
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import os
import json
from app.core.logger import get_logger

logger = get_logger(__name__)


class HistoricalDataService:
    """Service for collecting historical cryptocurrency data"""

    def __init__(self):
        # Use Binance US as primary to avoid geo-restrictions
        self.base_urls = [
            "https://api.binance.us/api/v3",  # Primary for US-based servers
            "https://api.binance.com/api/v3"   # Fallback
        ]
        self.data_dir = "data/klines"
        os.makedirs(self.data_dir, exist_ok=True)

        # In-memory cache
        self._cache = {}
        self._cache_timestamps = {}
        self._cache_ttl = 300  # 5 minutes TTL

        # Shared aiohttp session (singleton pattern)
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create shared aiohttp session"""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def close(self):
        """Close the aiohttp session (call on shutdown)"""
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None

    async def fetch_klines(
        self,
        symbol: str,
        interval: str = "1h",
        limit: int = 1000,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None
    ) -> List[List]:
        """
        Fetch historical K-line data with fallback strategy

        Tries multiple data sources to avoid geo-restrictions:
        1. Binance US API (primary)
        2. Binance.com API (fallback)

        Args:
            symbol: Trading symbol (e.g., BTCUSDT)
            interval: K-line interval (1m, 5m, 15m, 1h, 4h, 1d, etc.)
            limit: Number of data points (max 1000)
            start_time: Start timestamp in milliseconds
            end_time: End timestamp in milliseconds

        Returns:
            List of K-line data [timestamp, open, high, low, close, volume, ...]
        """
        params = {
            "symbol": symbol,
            "interval": interval,
            "limit": limit
        }

        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time

        session = await self._get_session()
        last_error = None

        # Try each API in order
        for base_url in self.base_urls:
            url = f"{base_url}/klines"
            api_name = "Binance US" if "binance.us" in base_url else "Binance.com"

            try:
                async with session.get(url, params=params) as response:
                    # Handle geo-restriction (451) - try next API
                    if response.status == 451:
                        logger.warning(f"[Historical Data] {api_name} geo-restricted (451), trying next...")
                        last_error = "Geo-restricted"
                        continue

                    if response.status == 200:
                        data = await response.json()
                        logger.debug(f"[Historical Data] Successfully fetched from {api_name}")
                        return data
                    else:
                        error_text = await response.text()
                        logger.warning(f"[Historical Data] {api_name} error: {response.status}, trying next...")
                        last_error = f"HTTP {response.status}"
                        continue

            except Exception as e:
                logger.warning(f"[Historical Data] {api_name} exception: {type(e).__name__}, trying next...")
                last_error = str(e)
                continue

        # All APIs failed
        raise Exception(f"All data sources failed for historical data. Last error: {last_error}")

    async def collect_historical_data(
        self,
        symbol: str,
        interval: str = "1h",
        days: int = 90
    ) -> pd.DataFrame:
        """
        Collect historical data for the past N days

        Args:
            symbol: Trading symbol (e.g., BTCUSDT)
            interval: K-line interval
            days: Number of days to collect

        Returns:
            DataFrame with OHLCV data
        """
        logger.info(f"[Historical Data] Collecting {days} days of {interval} data for {symbol}...")

        end_time = int(datetime.now().timestamp() * 1000)
        start_time = int((datetime.now() - timedelta(days=days)).timestamp() * 1000)

        all_klines = []
        current_start = start_time

        # Binance limits to 1000 candles per request
        # Calculate how many requests we need
        interval_ms = self._interval_to_ms(interval)
        total_candles = (end_time - start_time) // interval_ms
        requests_needed = (total_candles // 1000) + 1

        logger.info(f"[Historical Data] Estimated {total_candles} candles, {requests_needed} requests needed")

        for i in range(requests_needed):
            try:
                klines = await self.fetch_klines(
                    symbol=symbol,
                    interval=interval,
                    limit=1000,
                    start_time=current_start,
                    end_time=end_time
                )

                if not klines:
                    break

                all_klines.extend(klines)

                # Update start time for next request
                current_start = klines[-1][0] + 1

                # Respect rate limits
                await asyncio.sleep(0.5)

                logger.info(f"[Historical Data] Progress: {i+1}/{requests_needed} ({len(all_klines)} candles)")

            except Exception as e:
                logger.info(f"[Historical Data Error] {e}")
                break

        # Convert to DataFrame
        df = self._klines_to_dataframe(all_klines)
        logger.info(f"[Historical Data] Collected {len(df)} candles for {symbol}")

        return df

    def _klines_to_dataframe(self, klines: List[List]) -> pd.DataFrame:
        """Convert raw K-line data to DataFrame"""
        df = pd.DataFrame(klines, columns=[
            'timestamp', 'open', 'high', 'low', 'close', 'volume',
            'close_time', 'quote_volume', 'trades',
            'taker_buy_base', 'taker_buy_quote', 'ignore'
        ])

        # Convert to proper types
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df['open'] = df['open'].astype(float)
        df['high'] = df['high'].astype(float)
        df['low'] = df['low'].astype(float)
        df['close'] = df['close'].astype(float)
        df['volume'] = df['volume'].astype(float)

        # Keep only relevant columns
        df = df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]

        # Set timestamp as index
        df.set_index('timestamp', inplace=True)

        # Remove duplicates
        df = df[~df.index.duplicated(keep='first')]

        return df

    def _interval_to_ms(self, interval: str) -> int:
        """Convert interval string to milliseconds"""
        units = {
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000,
            'w': 7 * 24 * 60 * 60 * 1000
        }

        number = int(interval[:-1])
        unit = interval[-1]

        return number * units[unit]

    def save_to_csv(self, df: pd.DataFrame, symbol: str, interval: str):
        """Save DataFrame to CSV file"""
        filename = f"{self.data_dir}/{symbol}_{interval}.csv"
        df.to_csv(filename)
        logger.info(f"[Historical Data] Saved to {filename}")

    def load_from_csv(self, symbol: str, interval: str) -> Optional[pd.DataFrame]:
        """Load DataFrame from CSV file"""
        filename = f"{self.data_dir}/{symbol}_{interval}.csv"

        if os.path.exists(filename):
            df = pd.read_csv(filename, index_col='timestamp', parse_dates=True)
            logger.info(f"[Historical Data] Loaded {len(df)} candles from {filename}")
            return df
        else:
            logger.info(f"[Historical Data] File not found: {filename}")
            return None

    def _get_cache_key(self, symbol: str, interval: str, days: int) -> str:
        """Generate cache key"""
        return f"{symbol}_{interval}_{days}"

    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cache is still valid"""
        if cache_key not in self._cache_timestamps:
            return False

        cache_time = self._cache_timestamps[cache_key]
        age_seconds = (datetime.now() - cache_time).total_seconds()

        return age_seconds < self._cache_ttl

    async def get_or_fetch_data(
        self,
        symbol: str,
        interval: str = "1h",
        days: int = 90,
        force_refresh: bool = False
    ) -> pd.DataFrame:
        """
        Get data from cache or fetch from API

        Multi-level caching:
        1. In-memory cache (5 minutes TTL) - fastest
        2. CSV file cache (1 day validity) - fast
        3. Binance API fetch - slowest

        Args:
            symbol: Trading symbol
            interval: K-line interval
            days: Number of days
            force_refresh: Force fetch from API even if cache exists

        Returns:
            DataFrame with OHLCV data
        """
        cache_key = self._get_cache_key(symbol, interval, days)

        # Level 1: Check in-memory cache
        if not force_refresh and self._is_cache_valid(cache_key):
            # logger.info(f"[Historical Data] Using memory cache for {cache_key}")
            return self._cache[cache_key].copy()

        # Level 2: Try to load from CSV file cache
        if not force_refresh:
            df = self.load_from_csv(symbol, interval)
            if df is not None:
                # Check if data is recent enough (within 1 day)
                latest_timestamp = df.index[-1]
                if (datetime.now() - latest_timestamp.to_pydatetime()).days < 1:
                    # Update memory cache
                    self._cache[cache_key] = df.copy()
                    self._cache_timestamps[cache_key] = datetime.now()
                    return df

        # Level 3: Fetch fresh data from API
        df = await self.collect_historical_data(symbol, interval, days)
        self.save_to_csv(df, symbol, interval)

        # Update memory cache
        self._cache[cache_key] = df.copy()
        self._cache_timestamps[cache_key] = datetime.now()

        return df


# Singleton instance
_historical_data_service = None


def get_historical_data_service() -> HistoricalDataService:
    """Get or create HistoricalDataService singleton"""
    global _historical_data_service
    if _historical_data_service is None:
        _historical_data_service = HistoricalDataService()
    return _historical_data_service