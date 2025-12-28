"""
News API endpoints
Handles news collection, retrieval, and sentiment analysis
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.services.news_service import get_news_collector
from app.services.vector_service import get_vector_service
from app.services.sentiment_service import get_sentiment_analyzer
from app.services.scheduler_service import get_scheduler_service


router = APIRouter()


class NewsArticle(BaseModel):
    """News article model"""
    title: str
    content: str
    url: str
    source: str
    published_at: str
    symbols: List[str]
    sentiment: dict
    relevance_score: Optional[float] = None


class NewsCollectionResponse(BaseModel):
    """News collection response"""
    total_collected: int
    total_stored: int
    timestamp: datetime
    message: str


class NewsSearchRequest(BaseModel):
    """News search request"""
    query: str
    symbol: Optional[str] = None
    limit: int = 5
    time_range_hours: int = 24


@router.post("/news/collect", response_model=NewsCollectionResponse)
async def collect_news():
    """
    Collect latest news from all sources

    Fetches news from RSS feeds, analyzes sentiment,
    and stores in vector database for RAG retrieval.
    """
    try:
        # Collect news
        news_collector = get_news_collector()
        articles = await news_collector.collect_all_news()

        if not articles:
            return NewsCollectionResponse(
                total_collected=0,
                total_stored=0,
                timestamp=datetime.now(),
                message="No articles collected"
            )

        # Analyze sentiment
        sentiment_analyzer = get_sentiment_analyzer()
        articles = sentiment_analyzer.batch_analyze(articles)

        # Store in vector database
        vector_service = get_vector_service()
        stored_count = await vector_service.add_articles_batch(articles)

        return NewsCollectionResponse(
            total_collected=len(articles),
            total_stored=stored_count,
            timestamp=datetime.now(),
            message=f"Successfully collected and stored {stored_count} articles"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error collecting news: {str(e)}"
        )


@router.post("/news/search", response_model=List[NewsArticle])
async def search_news(request: NewsSearchRequest):
    """
    Search for relevant news articles

    Uses vector similarity search to find news articles
    relevant to the query and symbol.
    """
    try:
        vector_service = get_vector_service()

        articles = await vector_service.search_relevant_news(
            query=request.query,
            symbol=request.symbol,
            limit=request.limit,
            time_range_hours=request.time_range_hours
        )

        return [NewsArticle(**article) for article in articles]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching news: {str(e)}"
        )


@router.get("/news/recent/{symbol}", response_model=List[NewsArticle])
async def get_recent_news(
    symbol: str = "BTC",
    limit: int = 10,
    time_range_hours: int = 24
):
    """
    Get recent news for a specific cryptocurrency

    Args:
        symbol: Cryptocurrency symbol (e.g., BTC, ETH)
        limit: Maximum number of articles to return
        time_range_hours: Time range in hours

    Returns:
        List of recent news articles
    """
    try:
        vector_service = get_vector_service()

        articles = await vector_service.get_recent_news(
            symbol=symbol.upper(),
            limit=limit,
            time_range_hours=time_range_hours
        )

        return [NewsArticle(**article) for article in articles]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching recent news: {str(e)}"
        )


@router.get("/news/stats")
async def get_news_stats():
    """
    Get statistics about the news collection

    Returns:
        Collection statistics including total articles
    """
    try:
        vector_service = get_vector_service()
        stats = await vector_service.get_collection_stats()
        return stats

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching stats: {str(e)}"
        )


@router.get("/news/sentiment/{symbol}")
async def get_sentiment_overview(
    symbol: str = "BTC",
    time_range_hours: int = 24
):
    """
    Get sentiment overview for a symbol

    Analyzes sentiment distribution of recent news
    for the specified cryptocurrency.
    """
    try:
        vector_service = get_vector_service()

        # Get recent news
        articles = await vector_service.get_recent_news(
            symbol=symbol.upper(),
            limit=50,
            time_range_hours=time_range_hours
        )

        # Calculate sentiment distribution
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
        total_score = 0.0

        for article in articles:
            sentiment = article.get('sentiment', {})
            label = sentiment.get('label', 'neutral')
            score = sentiment.get('score', 0.0)

            sentiment_counts[label] += 1
            total_score += score

        avg_sentiment = total_score / len(articles) if articles else 0.0

        return {
            "symbol": symbol.upper(),
            "time_range_hours": time_range_hours,
            "total_articles": len(articles),
            "sentiment_distribution": sentiment_counts,
            "average_sentiment_score": round(avg_sentiment, 3),
            "overall_sentiment": "positive" if avg_sentiment > 0.1 else "negative" if avg_sentiment < -0.1 else "neutral"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing sentiment: {str(e)}"
        )


@router.get("/news/scheduler/status")
async def get_scheduler_status():
    """
    Get scheduler status

    Returns information about the news collection scheduler,
    including last update time and next scheduled run.
    """
    try:
        scheduler = get_scheduler_service()
        status = scheduler.get_status()
        return status

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting scheduler status: {str(e)}"
        )
