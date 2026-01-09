# ==================================
# CryptoSage AI - Backend Dockerfile
# ==================================

FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
# First install PyTorch CPU version from special index
RUN pip install --no-cache-dir torch==2.1.0 --index-url https://download.pytorch.org/whl/cpu

# Then install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建日志目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# 启动命令（生产环境）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# 开发环境使用 --reload
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
