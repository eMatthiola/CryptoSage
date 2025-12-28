"""
IP限流中间件 - 防止OpenAI API费用失控
简单、高效、无需数据库
"""

from datetime import datetime, timedelta
from typing import Dict, Tuple
import json
from pathlib import Path
import os
from app.core.logger import get_logger

logger = get_logger(__name__)



class IPRateLimiter:
    """
    基于IP的简单限流器
    每个IP每天限制请求次数，防止单个用户刷爆OpenAI费用

    特点：
    - 使用JSON文件存储（无需数据库）
    - 自动清理过期数据
    - 每天自动重置
    - 可配置限额
    """

    def __init__(self, max_per_day: int = 30):
        """
        初始化限流器

        Args:
            max_per_day: 每个IP每天最大请求次数（默认30次）
        """
        self.max_per_day = max_per_day

        # 数据文件路径
        data_dir = Path("data")
        data_dir.mkdir(exist_ok=True)
        self.storage_file = data_dir / "ip_usage.json"

        # 创建文件（如果不存在）
        if not self.storage_file.exists():
            self._save({})

    def can_request(self, ip: str) -> Tuple[bool, int]:
        """
        检查IP是否可以发起请求

        Args:
            ip: 客户端IP地址

        Returns:
            Tuple[bool, int]: (是否可以请求, 剩余次数)

        Example:
            >>> can_proceed, remaining = limiter.can_request("192.168.1.1")
            >>> if can_proceed:
            ...     logger.info(f"请求通过，今天还剩 {remaining} 次")
            ... else:
            ...     logger.info("今天的额度用完了")
        """
        today = self._get_today()
        usage = self._load()

        # 清理旧数据 + 初始化今天的记录
        usage = self._cleanup_old_data(usage, today)

        # 获取该IP今天的使用次数
        ip_count = usage[today].get(ip, 0)

        # 检查是否超过限额
        if ip_count >= self.max_per_day:
            return False, 0

        # 增加计数
        usage[today][ip] = ip_count + 1
        self._save(usage)

        # 计算剩余次数
        remaining = self.max_per_day - ip_count - 1
        return True, remaining

    def get_remaining(self, ip: str) -> int:
        """
        获取IP今天剩余的请求次数

        Args:
            ip: 客户端IP地址

        Returns:
            int: 剩余请求次数
        """
        today = self._get_today()
        usage = self._load()

        if today not in usage:
            return self.max_per_day

        ip_count = usage[today].get(ip, 0)
        return max(0, self.max_per_day - ip_count)

    def get_usage_today(self, ip: str) -> int:
        """
        获取IP今天已使用的请求次数

        Args:
            ip: 客户端IP地址

        Returns:
            int: 已使用次数
        """
        today = self._get_today()
        usage = self._load()

        if today not in usage:
            return 0

        return usage[today].get(ip, 0)

    def get_stats(self) -> Dict:
        """
        获取今日使用统计

        Returns:
            Dict: 包含今日总请求数、独立IP数等信息
        """
        today = self._get_today()
        usage = self._load()

        if today not in usage:
            return {
                "date": today,
                "total_requests": 0,
                "unique_ips": 0,
                "max_per_ip": self.max_per_day
            }

        today_data = usage[today]
        return {
            "date": today,
            "total_requests": sum(today_data.values()),
            "unique_ips": len(today_data),
            "max_per_ip": self.max_per_day,
            "top_users": sorted(
                [(ip, count) for ip, count in today_data.items()],
                key=lambda x: x[1],
                reverse=True
            )[:5]  # 前5名用户
        }

    def _get_today(self) -> str:
        """获取今天的日期字符串（YYYY-MM-DD）"""
        return datetime.now().strftime("%Y-%m-%d")

    def _cleanup_old_data(self, usage: Dict, today: str) -> Dict:
        """
        清理旧数据，只保留最近3天

        Args:
            usage: 当前使用数据
            today: 今天的日期字符串

        Returns:
            Dict: 清理后的数据
        """
        # 初始化今天的记录
        if today not in usage:
            usage[today] = {}

        # 只保留最近3天的数据（节省空间）
        cutoff_date = (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d")
        cleaned = {
            date: data
            for date, data in usage.items()
            if date >= cutoff_date
        }

        return cleaned

    def _load(self) -> Dict:
        """从文件加载使用数据"""
        try:
            with open(self.storage_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _save(self, data: Dict):
        """保存使用数据到文件"""
        try:
            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.info(f"Warning: Failed to save IP usage data: {e}")


# ============================================
# 全局单例
# ============================================

# 从环境变量读取限额配置（方便调整）
DAILY_LIMIT = int(os.getenv("DAILY_REQUEST_LIMIT", "30"))

# 创建全局限流器实例
limiter = IPRateLimiter(max_per_day=DAILY_LIMIT)

# Startup message (avoid Windows encoding issues)
try:
    logger.info(f"[OK] IP Rate Limiter enabled: {DAILY_LIMIT} requests per IP per day")
except UnicodeEncodeError:
    logger.info(f"[OK] IP Rate Limiter enabled: {DAILY_LIMIT} requests per IP per day")
