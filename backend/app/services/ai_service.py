"""
AI Service - OpenAI Integration
Handles intelligent conversation and market analysis
"""

from typing import AsyncIterator, List, Dict, Optional
from openai import AsyncOpenAI
from app.core.config import settings
import json
from app.core.logger import get_logger

logger = get_logger(__name__)

# Import vector service for RAG (lazy import to avoid circular dependencies)
_vector_service = None

def _get_vector_service():
    """Lazy import of vector service"""
    global _vector_service
    if _vector_service is None:
        try:
            from app.services.vector_service import get_vector_service
            _vector_service = get_vector_service()
        except Exception as e:
            logger.info(f"[AI Service] Could not load vector service: {e}")
            _vector_service = None
    return _vector_service


class AIAnalyzer:
    """
    AI Analysis Service
    Provides intelligent crypto market analysis using GPT-4o-mini
    """

    def __init__(self):
        """Initialize OpenAI client"""
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set in environment variables")

        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    async def analyze(
        self,
        question: str,
        symbol: str = "BTCUSDT",
        market_data: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None,
    ) -> AsyncIterator[str]:
        """
        Analyze user question with AI

        Args:
            question: User's question
            symbol: Trading symbol (e.g., BTCUSDT)
            market_data: Current market data (optional)
            conversation_history: Previous messages (optional)

        Yields:
            str: Streaming response chunks
        """

        # Build system prompt
        system_prompt = self._build_system_prompt()

        # Build user prompt with context (including news if available)
        user_prompt = await self._build_user_prompt_with_news(
            question=question,
            symbol=symbol,
            market_data=market_data,
            include_news=True
        )

        # Prepare messages
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-5:]:  # Keep last 5 messages
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

        # Add current question
        messages.append({"role": "user", "content": user_prompt})

        # Stream response from OpenAI
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                temperature=0.7,
                max_tokens=1000,
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            error_msg = f"Error calling OpenAI API: {str(e)}"
            logger.info(f"[AI Service Error] {error_msg}")
            yield f"\n\n[!] {error_msg}\n\nPlease check your OpenAI API key configuration."

    async def analyze_non_streaming(
        self,
        question: str,
        symbol: str = "BTCUSDT",
        market_data: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None,
    ) -> str:
        """
        Non-streaming version of analyze
        Returns complete response as a single string
        """

        system_prompt = self._build_system_prompt()
        user_prompt = await self._build_user_prompt_with_news(question, symbol, market_data, include_news=True)

        messages = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            for msg in conversation_history[-5:]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

        messages.append({"role": "user", "content": user_prompt})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
            )

            return response.choices[0].message.content

        except Exception as e:
            error_msg = f"Error calling OpenAI API: {str(e)}"
            logger.info(f"[AI Service Error] {error_msg}")
            return f"[!] {error_msg}\n\nPlease check your OpenAI API key configuration."

    def _build_system_prompt(self) -> str:
        """
        Build system prompt for AI
        This defines the AI's personality and capabilities
        """
        return """You are CryptoSage AI, a real-time cryptocurrency market intelligence assistant.

Your PRIMARY PURPOSE is to help users quickly understand and interpret market changes by aggregating and explaining information from multiple sources.

Your role is to:
1. **Explain what's happening** - Interpret current market data, news, and trends
2. **Provide context** - Help users understand WHY changes are occurring
3. **Highlight important changes** - Point out anomalies, trends, and significant movements
4. **Aggregate information** - Synthesize data from multiple sources (price data, order books, news, sentiment)

Data sources you have access to:
- Real-time Binance market data (prices, volume, order books)
- Technical indicators (RSI, MACD, Bollinger Bands, EMA)
- Order book depth analysis (bid/ask pressure, liquidity, large orders)
- Recent news from major crypto media (CoinDesk, Cointelegraph, Decrypt, The Block)
- Market sentiment analysis

Communication guidelines:
- Focus on **information and interpretation**, NOT investment advice
- Explain "what happened" and "why it might have happened"
- Avoid phrases like "you should buy/sell" or "this is a good entry point"
- Instead use: "the data shows...", "this could indicate...", "historically this means..."
- Be clear when information is missing or uncertain
- Use markdown formatting for clarity
- Cite data sources when available

CRITICAL LIMITATIONS:
- You do NOT provide trading signals or buy/sell recommendations
- You do NOT predict future prices
- You do NOT give investment advice
- You are an INFORMATION TOOL, not a decision-making tool

IMPORTANT DISCLAIMERS:
- All information is for educational and informational purposes only
- Not financial advice
- Users must do their own research and make their own decisions
- Cryptocurrency markets are highly volatile and risky

Example responses:
❌ BAD: "You should buy now, RSI is oversold"
✅ GOOD: "The RSI is currently at 28, which indicates the asset may be oversold according to technical analysis. Historically, this has sometimes preceded price rebounds, but it's not a guarantee."

❌ BAD: "This is a great entry point"
✅ GOOD: "The current price is 5% below the 7-day average, and order book shows increased buying pressure. However, news sentiment is mixed."
"""

    async def _build_user_prompt_with_news(
        self,
        question: str,
        symbol: str,
        market_data: Optional[Dict] = None,
        include_news: bool = True
    ) -> str:
        """
        Build user prompt with market data AND news context (RAG)

        Args:
            question: User's question
            symbol: Trading symbol
            market_data: Current market data
            include_news: Whether to include relevant news

        Returns:
            Formatted prompt with all context
        """
        # Start with market data
        prompt = self._build_user_prompt_base(question, symbol, market_data)

        # Add news context if available and requested
        if include_news:
            try:
                vector_service = _get_vector_service()
                if vector_service:
                    # Extract symbol without USDT
                    clean_symbol = symbol.replace('USDT', '').replace('USD', '')

                    # Search for relevant news
                    relevant_news = await vector_service.search_relevant_news(
                        query=question,
                        symbol=clean_symbol,
                        limit=3,
                        time_range_hours=24
                    )

                    if relevant_news:
                        news_section = ["\n**Recent News & Market Sentiment** (Last 24h):"]

                        for i, article in enumerate(relevant_news, 1):
                            sentiment = article.get('sentiment', {})
                            sentiment_label = sentiment.get('label', 'neutral')

                            # Sentiment indicators
                            sentiment_emoji = {
                                'positive': '>> POSITIVE',
                                'neutral': '-> NEUTRAL',
                                'negative': '<< NEGATIVE'
                            }.get(sentiment_label, '?? UNKNOWN')

                            news_section.append(f"\n{i}. {sentiment_emoji} **{article['title']}**")
                            news_section.append(f"   Source: {article['source']}")
                            news_section.append(f"   Sentiment Score: {sentiment.get('score', 0):.2f}")
                            news_section.append(f"   Summary: {article['content'][:150]}...")
                            news_section.append(f"   Relevance: {article['relevance_score']:.2f}")

                        prompt += "\n".join(news_section)
                        prompt += "\n"
            except Exception as e:
                logger.info(f"[AI Service] Error fetching news: {e}")
                # Continue without news if there's an error

        return prompt

    def _build_user_prompt_base(
        self,
        question: str,
        symbol: str,
        market_data: Optional[Dict] = None
    ) -> str:
        """
        Build user prompt with context

        Args:
            question: User's question
            symbol: Trading symbol
            market_data: Current market data

        Returns:
            Formatted prompt with context
        """

        prompt_parts = [f"**Trading Pair**: {symbol}\n"]

        # Add market data if available
        if market_data:
            prompt_parts.append("**Current Market Data**:")
            prompt_parts.append(f"- Price: ${market_data.get('price', 'N/A')}")
            prompt_parts.append(f"- 24h Change: {market_data.get('change_24h', 'N/A')}%")
            prompt_parts.append(f"- 24h High: ${market_data.get('high_24h', 'N/A')}")
            prompt_parts.append(f"- 24h Low: ${market_data.get('low_24h', 'N/A')}")
            prompt_parts.append(f"- 24h Volume: {market_data.get('volume_24h', 'N/A')}")

            prompt_parts.append("\n**Technical Indicators**:")
            if 'rsi' in market_data:
                prompt_parts.append(f"- RSI (14): {market_data['rsi']}")
            if 'macd' in market_data:
                prompt_parts.append(f"- MACD: {market_data['macd']} (Signal: {market_data.get('macd_signal', 'N/A')}, Histogram: {market_data.get('macd_histogram', 'N/A')})")
            if 'bb_upper' in market_data:
                prompt_parts.append(f"- Bollinger Bands: Upper ${market_data['bb_upper']}, Middle ${market_data['bb_middle']}, Lower ${market_data['bb_lower']}")
            if 'ema_20' in market_data:
                prompt_parts.append(f"- EMA: 20-period ${market_data['ema_20']}, 50-period ${market_data['ema_50']}")

            # Add orderbook analysis
            if 'orderbook' in market_data:
                orderbook = market_data['orderbook']
                prompt_parts.append("\n**Orderbook Analysis** (Key Differentiator!):")
                prompt_parts.append(f"- Bid/Ask Ratio: {orderbook.get('bid_ask_ratio', 'N/A')} (>1 = buying pressure, <1 = selling pressure)")
                prompt_parts.append(f"- Spread: ${orderbook.get('spread', 'N/A')} ({orderbook.get('spread_pct', 'N/A')}%)")
                prompt_parts.append(f"- Total Bid Volume: {orderbook.get('total_bid_volume', 'N/A')}")
                prompt_parts.append(f"- Total Ask Volume: {orderbook.get('total_ask_volume', 'N/A')}")
                large_orders = orderbook.get('large_orders', {})
                prompt_parts.append(f"- Large Orders: {large_orders.get('bids', 'N/A')} bids, {large_orders.get('asks', 'N/A')} asks")
                prompt_parts.append(f"- Depth Strength: {orderbook.get('depth_strength', 'N/A')}")

            prompt_parts.append("")  # Empty line
        else:
            prompt_parts.append("*Note: Real-time market data not available, using demo mode*\n")

        # Add user question
        prompt_parts.append(f"**User Question**: {question}\n")

        # Add instructions
        prompt_parts.append("Please provide a comprehensive analysis addressing the user's question.")
        prompt_parts.append("Structure your response with:")
        prompt_parts.append("1. Direct answer to the question")
        prompt_parts.append("2. Key insights and analysis")
        prompt_parts.append("3. Risk considerations")
        prompt_parts.append("4. Actionable recommendations (if applicable)")

        return "\n".join(prompt_parts)


# Global instance
_ai_analyzer = None


def get_ai_analyzer() -> AIAnalyzer:
    """
    Get or create AI analyzer instance (singleton pattern)
    """
    global _ai_analyzer
    if _ai_analyzer is None:
        _ai_analyzer = AIAnalyzer()
    return _ai_analyzer