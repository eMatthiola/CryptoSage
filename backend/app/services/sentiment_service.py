"""
Sentiment Analysis Service
Analyzes sentiment of cryptocurrency news articles
"""

from typing import Dict
import re


class SentimentAnalyzer:
    """
    Sentiment Analyzer for Crypto News

    Uses keyword-based sentiment analysis for crypto-specific terms.
    Can be upgraded to use FinBERT or other models later.
    """

    def __init__(self):
        """Initialize sentiment analyzer with keyword dictionaries"""

        # Positive keywords
        self.positive_keywords = {
            'bullish', 'bull', 'surge', 'soar', 'rally', 'gain', 'rise',
            'climb', 'jump', 'spike', 'breakthrough', 'adoption', 'growth',
            'profit', 'moon', 'lambo', 'hodl', 'buy', 'accumulate',
            'upgrade', 'partnership', 'institutional', 'milestone',
            'all-time high', 'ath', 'breakout', 'momentum', 'strong',
            'positive', 'uptrend', 'recovery', 'optimistic', 'confidence'
        }

        # Negative keywords
        self.negative_keywords = {
            'bearish', 'bear', 'crash', 'plunge', 'drop', 'fall', 'decline',
            'dump', 'sell', 'loss', 'down', 'weak', 'fear', 'panic',
            'regulation', 'ban', 'hack', 'scam', 'fraud', 'lawsuit',
            'investigate', 'warning', 'risk', 'volatile', 'bubble',
            'downturn', 'correction', 'resistance', 'sell-off', 'negative'
        }

        # Neutral keywords (for context)
        self.neutral_keywords = {
            'stable', 'consolidation', 'sideways', 'range', 'wait',
            'monitor', 'watch', 'neutral', 'unchanged', 'steady'
        }

    def _count_keywords(self, text: str, keywords: set) -> int:
        """Count occurrences of keywords in text"""
        text_lower = text.lower()
        count = 0

        for keyword in keywords:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(keyword) + r'\b'
            matches = re.findall(pattern, text_lower)
            count += len(matches)

        return count

    def analyze(self, text: str) -> Dict:
        """
        Analyze sentiment of text

        Args:
            text: Article content to analyze

        Returns:
            Dict with sentiment label, score, and confidence
        """
        if not text:
            return {
                "label": "neutral",
                "score": 0.0,
                "confidence": 0.0,
                "details": {
                    "positive_count": 0,
                    "negative_count": 0,
                    "neutral_count": 0
                }
            }

        # Count keywords
        positive_count = self._count_keywords(text, self.positive_keywords)
        negative_count = self._count_keywords(text, self.negative_keywords)
        neutral_count = self._count_keywords(text, self.neutral_keywords)

        total_count = positive_count + negative_count + neutral_count

        # Calculate sentiment score
        if total_count == 0:
            # No sentiment keywords found
            sentiment_score = 0.0
            label = "neutral"
            confidence = 0.1
        else:
            # Score from -1 (very negative) to +1 (very positive)
            sentiment_score = (positive_count - negative_count) / max(total_count, 1)

            # Determine label
            if sentiment_score > 0.2:
                label = "positive"
            elif sentiment_score < -0.2:
                label = "negative"
            else:
                label = "neutral"

            # Calculate confidence based on total keyword count
            confidence = min(total_count / 10.0, 1.0)  # Max confidence at 10+ keywords

        return {
            "label": label,
            "score": round(sentiment_score, 3),
            "confidence": round(confidence, 3),
            "details": {
                "positive_count": positive_count,
                "negative_count": negative_count,
                "neutral_count": neutral_count
            }
        }

    def batch_analyze(self, articles: list) -> list:
        """
        Analyze sentiment for multiple articles

        Args:
            articles: List of article dicts

        Returns:
            Articles with sentiment added
        """
        for article in articles:
            text = f"{article.get('title', '')} {article.get('content', '')}"
            sentiment = self.analyze(text)
            article['sentiment'] = sentiment

        return articles


# Global instance
_sentiment_analyzer = None


def get_sentiment_analyzer() -> SentimentAnalyzer:
    """
    Get or create sentiment analyzer instance (singleton pattern)
    """
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        _sentiment_analyzer = SentimentAnalyzer()
    return _sentiment_analyzer
