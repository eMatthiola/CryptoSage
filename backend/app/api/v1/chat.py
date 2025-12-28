"""
Chat API endpoints
Handles intelligent conversation with AI
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime
from app.services.ai_service import get_ai_analyzer
from app.services.market_service import get_market_service
from app.middleware.cost_control import limiter as ip_limiter
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.logger import get_logger

logger = get_logger(__name__)



# Initialize limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()


class Message(BaseModel):
    """Chat message model"""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    """Chat request model"""
    message: str
    symbol: str = "BTCUSDT"
    conversation_history: Optional[List[Message]] = []

    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        """Validate message length to prevent abuse"""
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        if len(v) > 5000:
            raise ValueError("Message too long (max 5000 characters)")
        return v.strip()

    @field_validator('conversation_history')
    @classmethod
    def validate_history(cls, v):
        """Validate conversation history to prevent abuse"""
        if v and len(v) > 20:
            raise ValueError("Conversation history too long (max 20 messages)")
        return v


class ChatResponse(BaseModel):
    """Chat response model"""
    message: str
    timestamp: datetime
    sources: Optional[List[dict]] = []


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")  # 10 requests per minute for chat
async def chat(request: Request, chat_request: ChatRequest):
    """
    Chat with AI assistant (Non-streaming version)

    This endpoint uses OpenAI GPT-4o-mini to provide intelligent
    cryptocurrency market analysis and trading insights.
    """

    # ==================== IP Rate Limiting ====================
    client_ip = request.client.host
    can_proceed, remaining = ip_limiter.can_request(client_ip)

    if not can_proceed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "daily_limit_exceeded",
                "message": "Daily AI chat limit reached (30 requests/day). Please try again tomorrow!",
                "remaining": 0,
                "reset_time": "Tomorrow 00:00"
            }
        )
    # ==========================================================

    try:
        # Get AI analyzer
        ai_analyzer = get_ai_analyzer()
        market_service = get_market_service()

        # Fetch real-time market data
        try:
            price_data = await market_service.get_current_price(chat_request.symbol)
            indicators = await market_service.get_technical_indicators(chat_request.symbol)
            orderbook = await market_service.get_orderbook(chat_request.symbol)

            # Combine market data
            market_data = {
                **price_data,
                **indicators,
                "orderbook": orderbook
            }
        except Exception as e:
            logger.info(f"[Chat API] Error fetching market data: {e}")
            market_data = None

        # Prepare conversation history
        history = []
        if chat_request.conversation_history:
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in chat_request.conversation_history
            ]

        # Get AI response (non-streaming)
        response_text = await ai_analyzer.analyze_non_streaming(
            question=chat_request.message,
            symbol=chat_request.symbol,
            market_data=market_data,
            conversation_history=history,
        )

        return ChatResponse(
            message=response_text,
            timestamp=datetime.utcnow(),
            sources=[
                {
                    "title": "OpenAI GPT-4o-mini",
                    "type": "ai_model"
                }
            ]
        )

    except ValueError as e:
        # API key not configured
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    except Exception as e:
        # Other errors
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat request: {str(e)}"
        )


@router.post("/chat/stream")
@limiter.limit("10/minute")  # 10 requests per minute for streaming chat
async def chat_stream(request: Request, chat_request: ChatRequest):
    """
    Chat with AI assistant (Streaming version)

    This endpoint streams the AI response in real-time,
    providing a better user experience for longer responses.
    """

    # ==================== IP Rate Limiting ====================
    client_ip = request.client.host
    can_proceed, remaining = ip_limiter.can_request(client_ip)

    if not can_proceed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "daily_limit_exceeded",
                "message": "Daily AI chat limit reached (30 requests/day). Please try again tomorrow!",
                "remaining": 0,
                "reset_time": "Tomorrow 00:00"
            }
        )

    # Note: Could add remaining count to response headers for frontend display
    # ==========================================================

    try:
        # Get AI analyzer and market service
        ai_analyzer = get_ai_analyzer()
        market_service = get_market_service()

        # Fetch real-time market data
        try:
            price_data = await market_service.get_current_price(chat_request.symbol)
            indicators = await market_service.get_technical_indicators(chat_request.symbol)
            orderbook = await market_service.get_orderbook(chat_request.symbol)

            # Combine market data
            market_data = {
                **price_data,
                **indicators,
                "orderbook": orderbook
            }
        except Exception as e:
            logger.info(f"[Chat API] Error fetching market data: {e}")
            market_data = None

        # Prepare conversation history
        history = []
        if chat_request.conversation_history:
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in chat_request.conversation_history
            ]

        # Stream AI response
        async def generate():
            async for chunk in ai_analyzer.analyze(
                question=chat_request.message,
                symbol=chat_request.symbol,
                market_data=market_data,
                conversation_history=history,
            ):
                yield chunk

        return StreamingResponse(
            generate(),
            media_type="text/plain"
        )

    except ValueError as e:
        # API key not configured
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    except Exception as e:
        # Other errors
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat request: {str(e)}"
        )


@router.get("/chat/history")
async def get_chat_history():
    """
    Get chat history
    TODO: Implement database storage
    """
    return {
        "history": [],
        "message": "Chat history feature coming soon"
    }
