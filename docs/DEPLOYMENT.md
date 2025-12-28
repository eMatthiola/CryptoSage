# 部署指南

## 📋 目录
- [概览](#概览)
- [Docker 部署](#docker-部署)
- [Vercel 部署（前端）](#vercel-部署前端)
- [Railway 部署（后端）](#railway-部署后端)
- [生产环境配置](#生产环境配置)
- [监控和日志](#监控和日志)
- [备份和恢复](#备份和恢复)

---

## 🌐 概览

### 部署架构

```
┌─────────────────────────────────────────────────┐
│              用户（浏览器）                      │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTPS
                 │
┌────────────────▼────────────────────────────────┐
│           Vercel Edge Network                   │
│           (前端 - Next.js)                      │
│           https://cryptosage.vercel.app         │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTPS API Calls
                 │
┌────────────────▼────────────────────────────────┐
│           Railway (后端 - FastAPI)              │
│           https://api.cryptosage.app            │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  FastAPI App (Docker Container)          │  │
│  └──────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────┘
                 │
     ┌───────────┼───────────┬──────────┐
     │           │           │          │
┌────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌──▼────┐
│PostgreSQL│ │ Redis  │ │Qdrant  │ │OpenAI │
│ (Railway)│ │(Railway)│ │(Cloud) │ │ API   │
└──────────┘ └────────┘ └────────┘ └───────┘
```

### 部署方案对比

| 方案 | 优点 | 缺点 | 成本 |
|------|------|------|------|
| **Vercel + Railway** | 简单、快速、免费额度 | 受限于免费额度 | $0-20/月 |
| **AWS (ECS + RDS)** | 稳定、可扩展 | 配置复杂 | $50-200/月 |
| **DigitalOcean** | 性价比高 | 需自行维护 | $10-50/月 |
| **自建服务器** | 完全控制 | 运维成本高 | $5-30/月 |

**推荐**: MVP 阶段使用 Vercel + Railway（免费/低成本）

---

## 🐳 Docker 部署

### 1. Dockerfile - 后端

```dockerfile
# backend/Dockerfile

FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Dockerfile - 前端

```dockerfile
# frontend/Dockerfile

FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制应用代码
COPY . .

# 构建应用
RUN npm run build

# 生产镜像
FROM node:18-alpine AS runner

WORKDIR /app

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]
```

### 3. Docker Compose - 完整栈

```yaml
# docker-compose.yml

version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: cryptosage-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cryptosage
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: cryptosage-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Qdrant 向量数据库
  qdrant:
    image: qdrant/qdrant:latest
    container_name: cryptosage-qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  # 后端 API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: cryptosage-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/cryptosage
      - REDIS_URL=redis://redis:6379
      - QDRANT_URL=http://qdrant:6333
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - BINANCE_API_KEY=${BINANCE_API_KEY}
      - BINANCE_SECRET_KEY=${BINANCE_SECRET_KEY}
      - ENVIRONMENT=production
      - DEBUG=false
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      qdrant:
        condition: service_started
    restart: unless-stopped

  # 前端 Web
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: cryptosage-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
```

### 4. 本地 Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend

# 停止服务
docker-compose down

# 停止并删除数据
docker-compose down -v
```

### 5. 环境变量管理

创建 `.env` 文件（不要提交到 Git）:

```env
# .env

OPENAI_API_KEY=sk-your-actual-key
BINANCE_API_KEY=your-binance-key
BINANCE_SECRET_KEY=your-binance-secret
```

`.gitignore`:
```
.env
*.env
!.env.example
```

---

## ☁️ Vercel 部署（前端）

### 1. 准备工作

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login
```

### 2. 配置 Next.js

```json
// frontend/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // Docker 部署需要
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
}

module.exports = nextConfig
```

### 3. Vercel 配置文件

```json
// vercel.json

{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.cryptosage.app"
  }
}
```

### 4. 部署步骤

**方法 1: 通过 Git（推荐）**

1. 推送代码到 GitHub:
```bash
git add .
git commit -m "feat: prepare for Vercel deployment"
git push origin main
```

2. 在 Vercel 网站:
   - 访问 https://vercel.com/
   - 点击 "Import Project"
   - 选择你的 GitHub 仓库
   - 配置环境变量
   - 点击 "Deploy"

**方法 2: 通过 CLI**

```bash
cd frontend

# 首次部署
vercel

# 生产环境部署
vercel --prod
```

### 5. 环境变量配置

在 Vercel Dashboard 中设置:
- `NEXT_PUBLIC_API_URL`: 后端 API URL
- `NEXT_PUBLIC_WS_URL`: WebSocket URL

### 6. 自定义域名

1. 在 Vercel 项目设置中添加域名
2. 在域名提供商处添加 CNAME 记录:
```
CNAME  www  cname.vercel-dns.com
```

---

## 🚂 Railway 部署（后端）

### 1. 准备工作

1. 注册 Railway: https://railway.app/
2. 安装 Railway CLI:
```bash
npm install -g @railway/cli

# 登录
railway login
```

### 2. Railway 配置文件

```toml
# railway.toml

[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 3. 部署步骤

**方法 1: 通过 Git**

1. 连接 GitHub 仓库:
   - 在 Railway Dashboard 创建新项目
   - 选择 "Deploy from GitHub repo"
   - 选择仓库和分支

2. 添加服务:
   - PostgreSQL
   - Redis
   - 后端应用

**方法 2: 通过 CLI**

```bash
cd backend

# 初始化项目
railway init

# 链接到项目
railway link

# 部署
railway up
```

### 4. 添加数据库

```bash
# 添加 PostgreSQL
railway add --plugin postgres

# 添加 Redis
railway add --plugin redis

# 查看环境变量
railway variables
```

Railway 会自动设置 `DATABASE_URL` 和 `REDIS_URL`

### 5. 环境变量配置

```bash
# 设置环境变量
railway variables set OPENAI_API_KEY=sk-your-key
railway variables set BINANCE_API_KEY=your-key
railway variables set ENVIRONMENT=production
```

或在 Railway Dashboard 中手动设置。

### 6. 查看日志

```bash
# 实时日志
railway logs

# 或在 Dashboard 查看
```

### 7. 自定义域名

在 Railway 项目设置中:
1. 点击 "Settings" -> "Domains"
2. 添加自定义域名
3. 配置 DNS:
```
CNAME  api  your-app.up.railway.app
```

---

## ⚙️ 生产环境配置

### 1. 环境变量（生产）

```env
# .env.production

# App
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING

# Database
DATABASE_URL=postgresql://user:password@host:5432/cryptosage

# Redis
REDIS_URL=redis://host:6379

# Qdrant
QDRANT_URL=https://your-qdrant-cluster.cloud

# OpenAI
OPENAI_API_KEY=sk-your-production-key

# Security
SECRET_KEY=your-super-secure-random-key-min-32-chars
ALLOWED_HOSTS=cryptosage.app,api.cryptosage.app

# CORS
CORS_ORIGINS=https://cryptosage.app,https://www.cryptosage.app
```

### 2. 生成安全密钥

```python
# 生成 SECRET_KEY
import secrets
print(secrets.token_urlsafe(32))
```

### 3. HTTPS 配置

**Vercel**: 自动 HTTPS ✅

**Railway**: 自动 HTTPS ✅

**自建服务器**: 使用 Let's Encrypt
```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.cryptosage.app
```

### 4. 反向代理（Nginx）

```nginx
# /etc/nginx/sites-available/cryptosage

upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.cryptosage.app;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.cryptosage.app;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/api.cryptosage.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.cryptosage.app/privkey.pem;

    # 安全设置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 代理设置
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 静态文件缓存
    location /static {
        alias /app/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 📊 监控和日志

### 1. 应用监控

**Sentry** (错误追踪)

```bash
# 安装
pip install sentry-sdk

# 配置
# backend/app/main.py
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment=settings.ENVIRONMENT,
    traces_sample_rate=0.1,
)
```

**Prometheus + Grafana** (指标监控)

```python
# 安装
pip install prometheus-fastapi-instrumentator

# app/main.py
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

### 2. 日志管理

```python
# app/core/logging.py

import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    logger = logging.getLogger("cryptosage")
    logger.setLevel(logging.INFO)

    # 文件处理器
    handler = RotatingFileHandler(
        "logs/app.log",
        maxBytes=10485760,  # 10MB
        backupCount=10
    )

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    return logger
```

### 3. 健康检查端点

```python
# app/api/v1/health.py

from fastapi import APIRouter
from app.core.database import engine
from app.core.cache import redis_client

router = APIRouter()

@router.get("/health/live")
async def liveness():
    """存活检查"""
    return {"status": "alive"}

@router.get("/health/ready")
async def readiness():
    """就绪检查"""
    checks = {
        "database": False,
        "redis": False,
    }

    # 检查数据库
    try:
        engine.execute("SELECT 1")
        checks["database"] = True
    except:
        pass

    # 检查 Redis
    try:
        redis_client.ping()
        checks["redis"] = True
    except:
        pass

    all_ready = all(checks.values())

    return {
        "status": "ready" if all_ready else "not_ready",
        "checks": checks
    }
```

---

## 💾 备份和恢复

### 1. 数据库备份

```bash
# 自动备份脚本
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DATABASE_URL="postgresql://user:pass@host:5432/cryptosage"

# 创建备份
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"

# 压缩
gzip "$BACKUP_DIR/backup_$DATE.sql"

# 上传到 S3（可选）
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" s3://your-bucket/backups/

# 删除 7 天前的本地备份
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

### 2. 定时备份（Cron）

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh
```

### 3. 恢复数据库

```bash
# 解压备份
gunzip backup_20240115_020000.sql.gz

# 恢复
psql $DATABASE_URL < backup_20240115_020000.sql
```

---

## 🚀 部署清单

### 部署前检查

- [ ] 所有测试通过
- [ ] 环境变量已配置
- [ ] 生产数据库已创建
- [ ] SSL 证书已配置
- [ ] 备份策略已设置
- [ ] 监控已配置
- [ ] 日志已配置
- [ ] 安全审计完成

### 部署步骤

1. **构建和测试**
   ```bash
   # 构建 Docker 镜像
   docker-compose build

   # 运行测试
   pytest
   npm test
   ```

2. **数据库迁移**
   ```bash
   alembic upgrade head
   ```

3. **部署后端**
   ```bash
   railway up  # 或 Docker 部署
   ```

4. **部署前端**
   ```bash
   vercel --prod
   ```

5. **验证部署**
   - 访问前端 URL
   - 测试 API 端点
   - 检查日志
   - 监控指标

---

## 📝 总结

本部署指南提供了多种部署方案：

1. **Docker**: 本地和自建服务器
2. **Vercel**: 前端（推荐）
3. **Railway**: 后端（推荐 MVP）
4. **生产配置**: 安全、监控、备份

选择适合你的方案，从 MVP 开始，逐步优化！

---

**恭喜！** 你现在有了完整的 CryptoSage AI 项目文档。

**下一步**:
1. 回顾 [README.md](../README.md) 了解项目全貌
2. 阅读 [DEVELOPMENT.md](DEVELOPMENT.md) 开始开发
3. 参考 [ARCHITECTURE.md](ARCHITECTURE.md) 理解系统设计
