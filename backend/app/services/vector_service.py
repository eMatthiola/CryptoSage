"""
Vector Service - RAG News Retrieval
Handles text vectorization and similarity search using Qdrant
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue, Range
from sentence_transformers import SentenceTransformer
import uuid
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class VectorService:
    """
    Vector Service for News RAG
    Manages embeddings and vector search with Qdrant
    """

    def __init__(self):
        """Initialize vector service"""
        # Connect to Qdrant
        qdrant_host = settings.QDRANT_URL.replace('http://', '').replace('https://', '').split(':')[0]
        qdrant_port = 6333

        self.client = QdrantClient(host=qdrant_host, port=qdrant_port)

        # Initialize embedding model
        # Using multilingual model for English + Chinese support
        logger.info("[Vector Service] Loading embedding model...")
        self.embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        self.embedding_dimension = 384  # MiniLM output dimension

        # Collection name
        self.collection_name = "crypto_news"

        # Initialize collection
        self._init_collection()

        logger.info("[Vector Service] Initialized successfully")

    def _init_collection(self):
        """Initialize or verify Qdrant collection"""
        try:
            # Check if collection exists
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]

            if self.collection_name not in collection_names:
                logger.info(f"[Vector Service] Creating collection: {self.collection_name}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dimension,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"[Vector Service] Collection created successfully")
            else:
                logger.info(f"[Vector Service] Collection '{self.collection_name}' already exists")

        except Exception as e:
            logger.info(f"[Vector Service] Error initializing collection: {e}")
            raise

    def _generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for text

        Args:
            text: Input text

        Returns:
            Embedding vector as list of floats
        """
        embedding = self.embedding_model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    async def add_article(self, article: Dict) -> bool:
        """
        Add news article to vector database

        Args:
            article: Article dict with title, content, etc.

        Returns:
            True if successful, False otherwise
        """
        try:
            # Generate combined text for embedding
            combined_text = f"{article.get('title', '')} {article.get('content', '')}"

            # Generate embedding
            embedding = self._generate_embedding(combined_text)

            # Prepare point
            point_id = article.get('id', str(uuid.uuid4()))

            # Create point
            point = PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "title": article.get('title', ''),
                    "content": article.get('content', ''),
                    "url": article.get('url', ''),
                    "source": article.get('source', ''),
                    "published_at": article.get('published_at', datetime.now().isoformat()),
                    "symbols": article.get('symbols', []),
                    "sentiment": article.get('sentiment', {}),
                    "collected_at": article.get('collected_at', datetime.now().isoformat())
                }
            )

            # Upsert to Qdrant
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )

            return True

        except Exception as e:
            logger.info(f"[Vector Service] Error adding article: {e}")
            return False

    async def add_articles_batch(self, articles: List[Dict]) -> int:
        """
        Add multiple articles in batch

        Args:
            articles: List of article dicts

        Returns:
            Number of successfully added articles
        """
        success_count = 0

        for article in articles:
            if await self.add_article(article):
                success_count += 1

        logger.info(f"[Vector Service] Added {success_count}/{len(articles)} articles")
        return success_count

    async def search_relevant_news(
        self,
        query: str,
        symbol: Optional[str] = None,
        limit: int = 5,
        time_range_hours: int = 48
    ) -> List[Dict]:
        """
        Search for relevant news articles

        Args:
            query: Search query text
            symbol: Filter by cryptocurrency symbol (e.g., 'BTC')
            limit: Max number of results
            time_range_hours: Only return news from last N hours

        Returns:
            List of relevant articles with scores
        """
        try:
            # Generate query embedding
            query_embedding = self._generate_embedding(query)

            # Build filter
            filter_conditions = []

            # Time filter (disabled for now - Qdrant expects numeric timestamps)
            # We'll filter in-memory after retrieval instead
            time_threshold = None
            if time_range_hours:
                time_threshold = datetime.now() - timedelta(hours=time_range_hours)

            # Symbol filter
            if symbol:
                filter_conditions.append(
                    FieldCondition(
                        key="symbols",
                        match=MatchValue(value=symbol.upper())
                    )
                )

            # Create filter
            query_filter = None
            if filter_conditions:
                query_filter = Filter(must=filter_conditions)

            # Search
            # Increase limit for time filtering
            search_limit = limit * 3 if time_threshold else limit

            search_results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_embedding,
                limit=search_limit,
                query_filter=query_filter if filter_conditions else None
            ).points

            # Format results and apply time filter in-memory
            articles = []
            for result in search_results:
                # Time filtering
                if time_threshold:
                    try:
                        from dateutil import parser as date_parser
                        published_dt = date_parser.parse(result.payload.get('published_at'))
                        if published_dt < time_threshold:
                            continue  # Skip old articles
                    except:
                        pass  # If parsing fails, include the article

                article = {
                    "title": result.payload.get('title'),
                    "content": result.payload.get('content'),
                    "url": result.payload.get('url'),
                    "source": result.payload.get('source'),
                    "published_at": result.payload.get('published_at'),
                    "symbols": result.payload.get('symbols', []),
                    "sentiment": result.payload.get('sentiment', {}),
                    "relevance_score": float(result.score) if hasattr(result, 'score') else 0.0
                }
                articles.append(article)

                # Stop if we have enough articles
                if len(articles) >= limit:
                    break

            logger.info(f"[Vector Service] Found {len(articles)} relevant articles for query: {query[:50]}...")
            return articles

        except Exception as e:
            logger.info(f"[Vector Service] Error searching: {e}")
            return []

    async def get_recent_news(
        self,
        symbol: Optional[str] = None,
        limit: int = 10,
        time_range_hours: int = 24
    ) -> List[Dict]:
        """
        Get recent news without specific query

        Args:
            symbol: Filter by symbol
            limit: Max results
            time_range_hours: Time range

        Returns:
            List of recent articles
        """
        # Use a generic query
        generic_query = f"cryptocurrency {symbol if symbol else 'market'} news"

        return await self.search_relevant_news(
            query=generic_query,
            symbol=symbol,
            limit=limit,
            time_range_hours=time_range_hours
        )

    async def get_collection_stats(self) -> Dict:
        """
        Get statistics about the news collection

        Returns:
            Dict with collection stats
        """
        try:
            collection_info = self.client.get_collection(self.collection_name)

            return {
                "total_articles": collection_info.points_count,
                "collection_name": self.collection_name,
                "vector_dimension": self.embedding_dimension,
                "status": "healthy"
            }

        except Exception as e:
            logger.info(f"[Vector Service] Error getting stats: {e}")
            return {
                "total_articles": 0,
                "status": "error",
                "error": str(e)
            }


# Global instance
_vector_service = None


def get_vector_service() -> VectorService:
    """
    Get or create vector service instance (singleton pattern)
    """
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
    return _vector_service
