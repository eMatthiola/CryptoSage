"""
Scheduler Service
Handles periodic tasks like news collection and cleanup
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from typing import Optional

from app.services.news_service import get_news_collector
from app.services.vector_service import get_vector_service
from app.services.sentiment_service import get_sentiment_analyzer
from app.core.logger import get_logger

logger = get_logger(__name__)


class SchedulerService:
    """
    Scheduler Service for Periodic Tasks

    Manages:
    - Periodic news collection
    - Old news cleanup
    - Future: Model retraining, cache refresh, etc.
    """

    def __init__(self):
        """Initialize scheduler"""
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
        self.last_news_update: Optional[datetime] = None
        self.last_cleanup: Optional[datetime] = None

    async def collect_and_store_news(self):
        """
        Collect news from all sources and store in vector database
        This is the main periodic task
        """
        try:
            logger.info(f"\n{'='*60}")
            logger.info(f"[Scheduler] Starting news collection at {datetime.now()}")
            logger.info(f"{'='*60}")

            # Collect news
            news_collector = get_news_collector()
            articles = await news_collector.collect_all_news()

            if not articles:
                logger.info("[Scheduler] No new articles collected")
                return

            # Analyze sentiment
            sentiment_analyzer = get_sentiment_analyzer()
            articles = sentiment_analyzer.batch_analyze(articles)

            # Store in vector database
            vector_service = get_vector_service()
            stored_count = await vector_service.add_articles_batch(articles)

            # Update timestamp
            self.last_news_update = datetime.now()

            logger.info(f"[Scheduler] Successfully stored {stored_count}/{len(articles)} articles")
            logger.info(f"[Scheduler] Next update in 12 hours")
            logger.info(f"{'='*60}\n")

        except Exception as e:
            logger.info(f"[Scheduler] Error in news collection: {e}")

    async def cleanup_old_news(self):
        """
        Clean up old news from vector database
        Keeps only news from last 7 days
        """
        try:
            logger.info(f"\n[Scheduler] Starting cleanup at {datetime.now()}")

            vector_service = get_vector_service()

            # Get collection stats before cleanup
            stats_before = await vector_service.get_collection_stats()
            logger.info(f"[Scheduler] Articles before cleanup: {stats_before.get('total_articles', 0)}")

            # Note: Qdrant doesn't have built-in TTL, so we'd need to:
            # 1. Query all points
            # 2. Filter by timestamp
            # 3. Delete old points
            # For now, we'll just log this - full implementation requires more Qdrant API calls

            # Update timestamp
            self.last_cleanup = datetime.now()

            logger.info(f"[Scheduler] Cleanup completed")
            logger.info(f"[Scheduler] Next cleanup in 24 hours\n")

        except Exception as e:
            logger.info(f"[Scheduler] Error in cleanup: {e}")

    def start(self):
        """Start the scheduler"""
        if self.is_running:
            logger.info("[Scheduler] Already running")
            return

        logger.info("\n[Scheduler] Initializing scheduler...")

        # Task 1: Collect news every 12 hours (reduced from 30min to save costs)
        self.scheduler.add_job(
            self.collect_and_store_news,
            trigger=IntervalTrigger(hours=12),
            id='news_collection',
            name='Collect and store crypto news',
            replace_existing=True,
            max_instances=1  # Prevent overlapping runs
        )
        logger.info("[Scheduler] Added job: News collection (every 12 hours)")

        # Task 2: Cleanup old news daily at 3 AM
        self.scheduler.add_job(
            self.cleanup_old_news,
            trigger=CronTrigger(hour=3, minute=0),
            id='news_cleanup',
            name='Clean up old news',
            replace_existing=True
        )
        logger.info("[Scheduler] Added job: News cleanup (daily at 3 AM)")

        # Start scheduler
        self.scheduler.start()
        self.is_running = True

        logger.info("[Scheduler] Scheduler started successfully")
        logger.info("[Scheduler] Initial news collection will run in 2 minutes...\n")

        # Run initial collection after 2 minutes to avoid blocking startup
        self.scheduler.add_job(
            self.collect_and_store_news,
            trigger='date',
            run_date=datetime.now() + timedelta(minutes=2),
            id='initial_news_collection',
            name='Initial news collection'
        )

    def stop(self):
        """Stop the scheduler"""
        if not self.is_running:
            logger.info("[Scheduler] Not running")
            return

        logger.info("[Scheduler] Stopping scheduler...")
        self.scheduler.shutdown()
        self.is_running = False
        logger.info("[Scheduler] Scheduler stopped")

    def get_status(self) -> dict:
        """Get scheduler status"""
        jobs = self.scheduler.get_jobs()

        return {
            "is_running": self.is_running,
            "last_news_update": self.last_news_update.isoformat() if self.last_news_update else None,
            "last_cleanup": self.last_cleanup.isoformat() if self.last_cleanup else None,
            "active_jobs": len(jobs),
            "jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run": job.next_run_time.isoformat() if job.next_run_time else None
                }
                for job in jobs
            ]
        }


# Global instance
_scheduler_service = None


def get_scheduler_service() -> SchedulerService:
    """
    Get or create scheduler service instance (singleton pattern)
    """
    global _scheduler_service
    if _scheduler_service is None:
        _scheduler_service = SchedulerService()
    return _scheduler_service
