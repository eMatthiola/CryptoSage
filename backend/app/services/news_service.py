"""
News Collection Service
Collects cryptocurrency news from various RSS feeds
Enhanced with deduplication, retry logic, and intelligent sorting
"""

from typing import List, Dict, Optional
import feedparser
import aiohttp
from datetime import datetime, timedelta
import hashlib
import re
from bs4 import BeautifulSoup
import asyncio
from difflib import SequenceMatcher
from app.core.logger import get_logger

logger = get_logger(__name__)


# News sources configuration
NEWS_SOURCES = {
    "coindesk": {
        "url": "https://www.coindesk.com/arc/outboundfeeds/rss/",
        "name": "CoinDesk"
    },
    "cointelegraph": {
        "url": "https://cointelegraph.com/rss",
        "name": "Cointelegraph"
    },
    "decrypt": {
        "url": "https://decrypt.co/feed",
        "name": "Decrypt"
    },
    "theblock": {
        "url": "https://www.theblock.co/rss.xml",
        "name": "The Block"
    }
}


class NewsCollector:
    """
    News Collector Service
    Fetches and processes cryptocurrency news from RSS feeds
    """

    def __init__(self):
        """Initialize news collector"""
        self.sources = NEWS_SOURCES
        self.max_retries = 3
        self.timeout = 30  # seconds
        self.similarity_threshold = 0.85  # For duplicate detection

    def _generate_article_id(self, url: str) -> str:
        """Generate unique ID for article based on URL"""
        return hashlib.md5(url.encode()).hexdigest()

    def _extract_symbols(self, text: str) -> List[str]:
        """
        Extract cryptocurrency symbols from text

        Args:
            text: Article title and content

        Returns:
            List of detected symbols (e.g., ['BTC', 'ETH'])
        """
        text_upper = text.upper()

        # Common cryptocurrency symbols and their variations
        symbol_map = {
            'BTC': ['BITCOIN', 'BTC', 'BTCUSDT'],
            'ETH': ['ETHEREUM', 'ETH', 'ETHUSDT', 'ETHER'],
            'BNB': ['BINANCE COIN', 'BNB', 'BNBUSDT'],
            'SOL': ['SOLANA', 'SOL', 'SOLUSDT'],
            'ADA': ['CARDANO', 'ADA', 'ADAUSDT'],
            'XRP': ['RIPPLE', 'XRP', 'XRPUSDT'],
            'DOGE': ['DOGECOIN', 'DOGE', 'DOGEUSDT'],
            'DOT': ['POLKADOT', 'DOT', 'DOTUSDT'],
            'MATIC': ['POLYGON', 'MATIC', 'MATICUSDT'],
            'AVAX': ['AVALANCHE', 'AVAX', 'AVAXUSDT']
        }

        detected_symbols = []

        for symbol, variations in symbol_map.items():
            for variation in variations:
                if variation in text_upper:
                    if symbol not in detected_symbols:
                        detected_symbols.append(symbol)
                    break

        # If no specific coin mentioned, assume general crypto news
        if not detected_symbols:
            detected_symbols = ['BTC']  # Default to BTC for general news

        return detected_symbols

    def _clean_html(self, html_text: str) -> str:
        """Remove HTML tags and clean text"""
        if not html_text:
            return ""

        soup = BeautifulSoup(html_text, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)

        return text.strip()

    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse various date formats to ISO format"""
        try:
            from dateutil import parser
            dt = parser.parse(date_str)
            return dt.isoformat()
        except:
            return datetime.now().isoformat()

    def _calculate_title_similarity(self, title1: str, title2: str) -> float:
        """
        Calculate similarity between two titles

        Args:
            title1: First title
            title2: Second title

        Returns:
            Similarity score between 0 and 1
        """
        return SequenceMatcher(None, title1.lower(), title2.lower()).ratio()

    def _is_duplicate(self, article: Dict, existing_articles: List[Dict]) -> bool:
        """
        Check if article is duplicate based on title similarity

        Args:
            article: Article to check
            existing_articles: List of existing articles

        Returns:
            True if duplicate found
        """
        for existing in existing_articles:
            # Check URL match (exact duplicate)
            if article['url'] == existing['url']:
                return True

            # Check title similarity (near duplicate)
            similarity = self._calculate_title_similarity(
                article['title'],
                existing['title']
            )

            if similarity >= self.similarity_threshold:
                return True

        return False

    def _calculate_article_score(self, article: Dict) -> float:
        """
        Calculate relevance score for article ranking

        Factors:
        - Recency (newer = higher score)
        - Source reputation
        - Specific coin mentions (more specific = higher score)

        Args:
            article: Article dict

        Returns:
            Score between 0 and 100
        """
        score = 0.0

        # Recency score (0-40 points)
        try:
            published_time = datetime.fromisoformat(article['published_at'].replace('Z', '+00:00'))
            age_hours = (datetime.now(published_time.tzinfo) - published_time).total_seconds() / 3600

            if age_hours < 1:
                score += 40
            elif age_hours < 6:
                score += 30
            elif age_hours < 24:
                score += 20
            else:
                score += 10
        except:
            score += 10  # Default for invalid dates

        # Source reputation (0-30 points)
        source_scores = {
            "CoinDesk": 30,
            "Cointelegraph": 25,
            "The Block": 28,
            "Decrypt": 20
        }
        score += source_scores.get(article['source'], 15)

        # Specificity score (0-30 points)
        # More specific coin mentions = higher score
        symbols = article.get('symbols', [])
        if len(symbols) == 1:
            score += 30  # Specific to one coin
        elif len(symbols) <= 3:
            score += 20  # Mentions a few coins
        else:
            score += 10  # General crypto news

        return min(score, 100.0)

    def _sort_articles(self, articles: List[Dict]) -> List[Dict]:
        """
        Sort articles by relevance score

        Args:
            articles: List of articles

        Returns:
            Sorted list of articles
        """
        # Calculate scores
        for article in articles:
            article['relevance_score'] = self._calculate_article_score(article)

        # Sort by score (descending) and then by date (newest first)
        return sorted(
            articles,
            key=lambda x: (x['relevance_score'], x['published_at']),
            reverse=True
        )

    async def fetch_rss_feed(self, source_key: str, retry_count: int = 0) -> List[Dict]:
        """
        Fetch news from a single RSS feed with retry logic

        Args:
            source_key: Key from NEWS_SOURCES dict
            retry_count: Current retry attempt

        Returns:
            List of parsed articles
        """
        if source_key not in self.sources:
            logger.info(f"[News Collector] Unknown source: {source_key}")
            return []

        source = self.sources[source_key]

        try:
            logger.info(f"[News Collector] Fetching from {source['name']}...")

            # Parse RSS feed with timeout
            async with asyncio.timeout(self.timeout):
                feed = await asyncio.to_thread(feedparser.parse, source['url'])

            if not feed.entries:
                logger.info(f"[News Collector] No entries found for {source['name']}")
                return []

            articles = []

            for entry in feed.entries[:20]:  # Limit to latest 20 articles
                # Extract basic info
                title = entry.get('title', '').strip()
                url = entry.get('link', '').strip()

                if not title or not url:
                    continue

                # Get content
                content = ''
                if hasattr(entry, 'summary'):
                    content = self._clean_html(entry.summary)
                elif hasattr(entry, 'description'):
                    content = self._clean_html(entry.description)

                # Limit content length
                if len(content) > 500:
                    content = content[:500] + '...'

                # Parse date
                published_at = None
                if hasattr(entry, 'published'):
                    published_at = self._parse_date(entry.published)
                elif hasattr(entry, 'updated'):
                    published_at = self._parse_date(entry.updated)
                else:
                    published_at = datetime.now().isoformat()

                # Extract symbols
                full_text = f"{title} {content}"
                symbols = self._extract_symbols(full_text)

                article = {
                    "id": self._generate_article_id(url),
                    "title": title,
                    "content": content,
                    "url": url,
                    "source": source['name'],
                    "published_at": published_at,
                    "symbols": symbols,
                    "collected_at": datetime.now().isoformat()
                }

                articles.append(article)

            logger.info(f"[News Collector] Collected {len(articles)} articles from {source['name']}")
            return articles

        except asyncio.TimeoutError:
            logger.info(f"[News Collector] Timeout fetching from {source['name']}")
            if retry_count < self.max_retries:
                logger.info(f"[News Collector] Retrying {source['name']} (attempt {retry_count + 1}/{self.max_retries})...")
                await asyncio.sleep(2 ** retry_count)  # Exponential backoff
                return await self.fetch_rss_feed(source_key, retry_count + 1)
            return []

        except Exception as e:
            logger.info(f"[News Collector] Error fetching from {source['name']}: {e}")
            if retry_count < self.max_retries:
                logger.info(f"[News Collector] Retrying {source['name']} (attempt {retry_count + 1}/{self.max_retries})...")
                await asyncio.sleep(2 ** retry_count)  # Exponential backoff
                return await self.fetch_rss_feed(source_key, retry_count + 1)
            return []

    async def collect_all_news(self) -> List[Dict]:
        """
        Collect news from all configured sources with parallel fetching

        Features:
        - Parallel fetching from all sources
        - Intelligent deduplication (URL + title similarity)
        - Relevance scoring and sorting
        - Error handling with retries

        Returns:
            Combined, deduplicated, and sorted list of articles
        """
        logger.info("[News Collector] Starting news collection from all sources...")

        # Fetch from all sources in parallel
        tasks = [self.fetch_rss_feed(source_key) for source_key in self.sources.keys()]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect all articles, handling any exceptions
        all_articles = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                source_key = list(self.sources.keys())[i]
                logger.info(f"[News Collector] Failed to fetch from {self.sources[source_key]['name']}: {result}")
            elif isinstance(result, list):
                all_articles.extend(result)

        logger.info(f"[News Collector] Total collected: {len(all_articles)} articles")

        # Advanced deduplication (URL + title similarity)
        unique_articles = []

        for article in all_articles:
            if not self._is_duplicate(article, unique_articles):
                unique_articles.append(article)
            else:
                logger.info(f"[News Collector] Skipping duplicate: {article['title'][:50]}...")

        logger.info(f"[News Collector] After deduplication: {len(unique_articles)} articles")

        # Sort by relevance
        sorted_articles = self._sort_articles(unique_articles)

        logger.info(f"[News Collector] Articles sorted by relevance score")

        return sorted_articles


# Global instance
_news_collector = None


def get_news_collector() -> NewsCollector:
    """
    Get or create news collector instance (singleton pattern)
    """
    global _news_collector
    if _news_collector is None:
        _news_collector = NewsCollector()
    return _news_collector
