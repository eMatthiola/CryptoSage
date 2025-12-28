"""
Logging Configuration for CryptoSage AI
Centralized logging setup with file rotation and console output
"""

import logging
import sys
import os
from pathlib import Path
from logging.handlers import RotatingFileHandler
from typing import Optional


class LoggerConfig:
    """Logger configuration manager"""

    _loggers = {}

    @classmethod
    def setup_logger(
        cls,
        name: str,
        level: Optional[int] = None,
        log_file: Optional[str] = None
    ) -> logging.Logger:
        """
        Setup and return a configured logger

        Args:
            name: Logger name (usually __name__)
            level: Logging level (defaults to LOG_LEVEL env var)
            log_file: Optional specific log file path

        Returns:
            Configured logger instance
        """
        # Return existing logger if already configured
        if name in cls._loggers:
            return cls._loggers[name]

        logger = logging.getLogger(name)

        # Set level from environment or parameter
        env_log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
        log_level = level or getattr(logging, env_log_level, logging.INFO)
        logger.setLevel(log_level)

        # Clear existing handlers to avoid duplicates
        logger.handlers.clear()

        # Console handler with formatting
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

        # File handler with rotation (if not in debug mode or log_file specified)
        debug_mode = os.getenv('DEBUG', 'true').lower() == 'true'
        if not debug_mode or log_file:
            # Create logs directory if it doesn't exist
            log_dir = Path("logs")
            log_dir.mkdir(exist_ok=True)

            # Use provided log file or default
            environment = os.getenv('ENVIRONMENT', 'development')
            file_path = log_file or f"logs/{environment}.log"

            # Rotating file handler (10MB max, keep 5 backups)
            file_handler = RotatingFileHandler(
                file_path,
                maxBytes=10 * 1024 * 1024,  # 10MB
                backupCount=5,
                encoding='utf-8'
            )
            file_handler.setLevel(log_level)
            file_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            file_handler.setFormatter(file_formatter)
            logger.addHandler(file_handler)

        # Prevent propagation to avoid duplicate logs
        logger.propagate = False

        # Cache the logger
        cls._loggers[name] = logger

        return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get or create a logger instance

    Args:
        name: Logger name (usually __name__)

    Returns:
        Configured logger instance

    Example:
        >>> from app.core.logger import get_logger
        >>> logger = get_logger(__name__)
        >>> logger.info("Application started")
    """
    return LoggerConfig.setup_logger(name)


# Create default application logger
app_logger = get_logger("cryptosage")
