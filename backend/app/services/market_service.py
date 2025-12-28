"""
Market Data Service - Binance API Integration
Fetches real-time cryptocurrency market data
"""

from typing import Dict, List, Optional
from binance import AsyncClient
from binance.exceptions import BinanceAPIException
import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import MACD, EMAIndicator
from ta.volatility import BollingerBands
from datetime import datetime
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class MarketDataService:
    """
    Market Data Service
    Provides real-time market data from Binance
    """

    def __init__(self):
        """Initialize Binance client"""
        self.client: Optional[AsyncClient] = None
        self.api_key = settings.BINANCE_API_KEY
        self.api_secret = settings.BINANCE_SECRET_KEY

    async def _get_client(self) -> AsyncClient:
        """Get or create Binance client"""
        if self.client is None:
            if self.api_key and self.api_secret:
                # Authenticated client
                self.client = await AsyncClient.create(
                    api_key=self.api_key,
                    api_secret=self.api_secret
                )
            else:
                # Public client (no API key needed)
                self.client = await AsyncClient.create()
        return self.client

    async def close(self):
        """Close Binance client"""
        if self.client:
            await self.client.close_connection()
            self.client = None

    async def get_current_price(self, symbol: str = "BTCUSDT") -> Dict:
        """
        Get current price for a symbol

        Args:
            symbol: Trading pair symbol (e.g., BTCUSDT)

        Returns:
            Dict with current price data
        """
        try:
            client = await self._get_client()

            # Get 24hr ticker
            ticker = await client.get_ticker(symbol=symbol)

            return {
                "symbol": symbol,
                "price": float(ticker['lastPrice']),
                "change_24h": float(ticker['priceChangePercent']),
                "volume_24h": float(ticker['volume']),
                "high_24h": float(ticker['highPrice']),
                "low_24h": float(ticker['lowPrice']),
                "timestamp": datetime.now().isoformat()
            }

        except BinanceAPIException as e:
            logger.info(f"[Market Service Error] Binance API error: {e}")
            return self._get_demo_data(symbol)
        except Exception as e:
            logger.info(f"[Market Service Error] Error fetching price: {e}")
            return self._get_demo_data(symbol)

    async def get_historical_klines(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "1h",
        limit: int = 100
    ) -> pd.DataFrame:
        """
        Get historical candlestick data

        Args:
            symbol: Trading pair symbol
            interval: Kline interval (1m, 5m, 15m, 1h, 4h, 1d)
            limit: Number of klines to fetch (max 1000)

        Returns:
            DataFrame with OHLCV data
        """
        try:
            client = await self._get_client()

            # Get klines
            klines = await client.get_klines(
                symbol=symbol,
                interval=interval,
                limit=limit
            )

            # Convert to DataFrame
            df = pd.DataFrame(klines, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_volume', 'trades',
                'taker_buy_base', 'taker_buy_quote', 'ignore'
            ])

            # Convert to proper types
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            for col in ['open', 'high', 'low', 'close', 'volume']:
                df[col] = df[col].astype(float)

            # Set index
            df.set_index('timestamp', inplace=True)

            return df[['open', 'high', 'low', 'close', 'volume']]

        except Exception as e:
            logger.info(f"[Market Service Error] Error fetching klines: {e}")
            return pd.DataFrame()

    async def get_technical_indicators(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "1h"
    ) -> Dict:
        """
        Calculate technical indicators

        Args:
            symbol: Trading pair symbol
            interval: Timeframe for indicators

        Returns:
            Dict with technical indicators
        """
        try:
            # Get historical data
            df = await self.get_historical_klines(symbol, interval, limit=100)

            if df.empty:
                return self._get_demo_indicators()

            # Calculate indicators
            close = df['close']

            # RSI
            rsi = RSIIndicator(close=close, window=14)
            current_rsi = rsi.rsi().iloc[-1]

            # MACD
            macd = MACD(close=close)
            current_macd = macd.macd().iloc[-1]
            current_signal = macd.macd_signal().iloc[-1]
            current_histogram = macd.macd_diff().iloc[-1]

            # Bollinger Bands
            bb = BollingerBands(close=close, window=20, window_dev=2)
            bb_upper = bb.bollinger_hband().iloc[-1]
            bb_middle = bb.bollinger_mavg().iloc[-1]
            bb_lower = bb.bollinger_lband().iloc[-1]

            # EMA
            ema_20 = EMAIndicator(close=close, window=20).ema_indicator().iloc[-1]
            ema_50 = EMAIndicator(close=close, window=50).ema_indicator().iloc[-1]

            return {
                "symbol": symbol,
                "interval": interval,
                "rsi": round(float(current_rsi), 2),
                "macd": round(float(current_macd), 2),
                "macd_signal": round(float(current_signal), 2),
                "macd_histogram": round(float(current_histogram), 2),
                "bb_upper": round(float(bb_upper), 2),
                "bb_middle": round(float(bb_middle), 2),
                "bb_lower": round(float(bb_lower), 2),
                "ema_20": round(float(ema_20), 2),
                "ema_50": round(float(ema_50), 2),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.info(f"[Market Service Error] Error calculating indicators: {e}")
            return self._get_demo_indicators()

    async def get_orderbook(
        self,
        symbol: str = "BTCUSDT",
        limit: int = 20
    ) -> Dict:
        """
        Get orderbook data and analyze depth

        Args:
            symbol: Trading pair symbol
            limit: Depth limit (5, 10, 20, 50, 100, 500, 1000, 5000)

        Returns:
            Dict with orderbook analysis
        """
        try:
            client = await self._get_client()

            # Get order book
            depth = await client.get_order_book(symbol=symbol, limit=limit)

            # Calculate metrics
            bids = depth['bids']
            asks = depth['asks']

            total_bid_volume = sum(float(bid[1]) for bid in bids)
            total_ask_volume = sum(float(ask[1]) for ask in asks)

            # Bid/Ask ratio
            bid_ask_ratio = total_bid_volume / total_ask_volume if total_ask_volume > 0 else 1.0

            # Spread
            best_bid = float(bids[0][0])
            best_ask = float(asks[0][0])
            spread = best_ask - best_bid
            spread_pct = (spread / best_ask) * 100

            # Large orders (top 20% by volume)
            bid_volumes = [float(bid[1]) for bid in bids]
            ask_volumes = [float(ask[1]) for ask in asks]

            bid_threshold = sorted(bid_volumes, reverse=True)[int(len(bid_volumes) * 0.2)]
            ask_threshold = sorted(ask_volumes, reverse=True)[int(len(ask_volumes) * 0.2)]

            large_bids = sum(1 for v in bid_volumes if v >= bid_threshold)
            large_asks = sum(1 for v in ask_volumes if v >= ask_threshold)

            return {
                "symbol": symbol,
                "bid_ask_ratio": round(bid_ask_ratio, 3),
                "spread": round(spread, 2),
                "spread_pct": round(spread_pct, 4),
                "total_bid_volume": round(total_bid_volume, 4),
                "total_ask_volume": round(total_ask_volume, 4),
                "large_orders": {
                    "bids": large_bids,
                    "asks": large_asks
                },
                "depth_strength": round(min(total_bid_volume, total_ask_volume) / 1000, 2),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.info(f"[Market Service Error] Error fetching orderbook: {e}")
            return self._get_demo_orderbook()

    def _get_demo_data(self, symbol: str) -> Dict:
        """Return demo market data when API is unavailable"""
        return {
            "symbol": symbol,
            "price": 43250.50,
            "change_24h": 2.35,
            "volume_24h": 28500000000,
            "high_24h": 44100.00,
            "low_24h": 42800.00,
            "timestamp": datetime.now().isoformat(),
            "_demo": True
        }

    def _get_demo_indicators(self) -> Dict:
        """Return demo technical indicators"""
        return {
            "rsi": 62.5,
            "macd": 120.5,
            "macd_signal": 115.2,
            "macd_histogram": 5.3,
            "bb_upper": 44500.0,
            "bb_middle": 43250.0,
            "bb_lower": 42000.0,
            "ema_20": 43100.0,
            "ema_50": 42800.0,
            "_demo": True
        }

    def _get_demo_orderbook(self) -> Dict:
        """Return demo orderbook data"""
        return {
            "bid_ask_ratio": 1.15,
            "spread": 10.5,
            "spread_pct": 0.024,
            "total_bid_volume": 150.5,
            "total_ask_volume": 130.8,
            "large_orders": {
                "bids": 3,
                "asks": 2
            },
            "depth_strength": 0.85,
            "_demo": True
        }


# Global instance
_market_service = None


def get_market_service() -> MarketDataService:
    """
    Get or create market service instance (singleton pattern)
    """
    global _market_service
    if _market_service is None:
        _market_service = MarketDataService()
    return _market_service
