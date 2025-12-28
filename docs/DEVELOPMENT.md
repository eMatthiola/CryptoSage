# 开发指南

## 📋 目录
- [环境准备](#环境准备)
- [快速开始](#快速开始)
- [前端开发](#前端开发)
- [后端开发](#后端开发)
- [数据库管理](#数据库管理)
- [测试](#测试)
- [常见问题](#常见问题)

---

## 💻 环境准备

### 系统要求

- **操作系统**: Windows 10/11 (你的环境)
- **Docker Desktop**: 4.x+
- **Node.js**: 18.x+
- **Python**: 3.11+
- **Git**: 2.x+

### 安装必需工具

#### 1. Docker Desktop（已安装✅）

验证安装:
```bash
docker --version
docker-compose --version
```

#### 2. Node.js

下载并安装: https://nodejs.org/ (LTS 版本)

验证安装:
```bash
node --version  # 应显示 v18.x.x 或更高
npm --version
```

#### 3. Python

下载并安装: https://www.python.org/downloads/ (3.11+)

**重要**: 安装时勾选 "Add Python to PATH"

验证安装:
```bash
python --version  # 应显示 Python 3.11.x 或更高
pip --version
```

#### 4. Git

下载并安装: https://git-scm.com/download/win

验证安装:
```bash
git --version
```

---

## 🚀 快速开始

### 1. 克隆项目（或初始化）

如果你还没有 Git 仓库:
```bash
cd C:\Users\38309
cd cryptosage
git init
git add .
git commit -m "Initial commit: project structure and documentation"
```

如果从远程克隆:
```bash
git clone https://github.com/yourusername/cryptosage.git
cd cryptosage
```

### 2. 环境变量配置

创建 `.env` 文件:
```bash
# 在项目根目录
copy .env.example .env  # Windows
```

编辑 `.env` 文件:
```env
# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here

# Database (Docker 自动配置)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cryptosage

# Redis (Docker 自动配置)
REDIS_URL=redis://localhost:6379

# Qdrant (Docker 自动配置)
QDRANT_URL=http://localhost:6333

# Binance API (可选)
BINANCE_API_KEY=your-binance-api-key
BINANCE_SECRET_KEY=your-binance-secret-key

# 应用配置
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# JWT Secret (Phase 2)
SECRET_KEY=your-super-secret-key-change-in-production
```

### 3. Docker 启动所有服务（推荐）

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

访问服务:
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Qdrant Dashboard: http://localhost:6333/dashboard

### 4. 本地开发模式（不用 Docker）

如果你想在本地直接运行（便于调试）:

**启动数据库（Docker）**:
```bash
# 只启动数据库服务
docker-compose up -d postgres redis qdrant
```

**前端**:
```bash
cd frontend
npm install
npm run dev
```

**后端**:
```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境（Windows）
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 运行开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🎨 前端开发

### 项目结构

```
frontend/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/              # 认证页面组
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/              # 主应用页面组
│   │   ├── page.tsx         # 首页
│   │   ├── chat/
│   │   ├── dashboard/
│   │   └── settings/
│   ├── api/                 # API Routes
│   ├── layout.tsx           # 根布局
│   └── globals.css          # 全局样式
│
├── components/              # React 组件
│   ├── chat/
│   │   ├── ChatPanel.tsx
│   │   ├── MessageList.tsx
│   │   └── InputBox.tsx
│   ├── dashboard/
│   │   ├── PredictionDashboard.tsx
│   │   └── FeatureChart.tsx
│   ├── market/
│   │   ├── MarketOverview.tsx
│   │   └── PriceChart.tsx
│   └── ui/                  # Shadcn/ui 组件
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
│
├── lib/                     # 工具函数
│   ├── api.ts              # API 客户端
│   ├── utils.ts            # 通用工具
│   └── websocket.ts        # WebSocket 客户端
│
├── hooks/                   # 自定义 Hooks
│   ├── useChat.ts
│   ├── usePrediction.ts
│   └── useMarketData.ts
│
├── stores/                  # Zustand 状态管理
│   ├── chatStore.ts
│   ├── marketStore.ts
│   └── userStore.ts
│
├── types/                   # TypeScript 类型
│   ├── chat.ts
│   ├── prediction.ts
│   └── market.ts
│
└── public/                  # 静态资源
    ├── logo.svg
    └── favicon.ico
```

### 初始化前端项目

```bash
cd frontend

# 使用 create-next-app 初始化
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# 安装依赖
npm install zustand                    # 状态管理
npm install @tanstack/react-query      # 数据获取
npm install socket.io-client           # WebSocket
npm install recharts                   # 图表
npm install react-markdown             # Markdown 渲染
npm install axios                      # HTTP 客户端
npm install date-fns                   # 日期处理

# 安装 Shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input textarea
```

### 开发脚本

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

### 运行开发服务器

```bash
npm run dev
```

访问: http://localhost:3000

### 环境变量（前端）

创建 `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 示例：API 客户端

```typescript
// lib/api.ts

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 聊天 API
export const chatAPI = {
  sendMessage: async (message: string, symbol: string) => {
    const response = await api.post('/chat/message', {
      message,
      symbol,
      stream: false,
    });
    return response.data;
  },
};

// 预测 API
export const predictionAPI = {
  getPrediction: async (symbol: string, timeframe: string = '1h') => {
    const response = await api.get(`/predictions/${symbol}`, {
      params: { timeframe },
    });
    return response.data;
  },
};

// 市场数据 API
export const marketAPI = {
  getPrice: async (symbol: string) => {
    const response = await api.get(`/market/${symbol}/price`);
    return response.data;
  },
};
```

### 示例：自定义 Hook

```typescript
// hooks/usePrediction.ts

import { useQuery } from '@tanstack/react-query';
import { predictionAPI } from '@/lib/api';

export function usePrediction(symbol: string, timeframe: string = '1h') {
  return useQuery({
    queryKey: ['prediction', symbol, timeframe],
    queryFn: () => predictionAPI.getPrediction(symbol, timeframe),
    refetchInterval: 5 * 60 * 1000, // 5 分钟刷新
    staleTime: 4 * 60 * 1000,       // 4 分钟内不重复请求
  });
}
```

---

## 🐍 后端开发

### 项目结构

```
backend/
├── app/
│   ├── main.py              # FastAPI 入口
│   ├── config.py            # 配置管理
│   ├── dependencies.py      # 依赖注入
│   │
│   ├── api/                 # API 路由
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py
│   │   │   ├── prediction.py
│   │   │   ├── market.py
│   │   │   └── news.py
│   │   └── websocket.py
│   │
│   ├── services/            # 业务逻辑
│   │   ├── __init__.py
│   │   ├── ai_service.py
│   │   ├── ml_service.py
│   │   ├── market_service.py
│   │   └── news_service.py
│   │
│   ├── models/              # ORM 模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── conversation.py
│   │   ├── prediction.py
│   │   └── market_data.py
│   │
│   ├── schemas/             # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── chat.py
│   │   ├── prediction.py
│   │   └── market.py
│   │
│   ├── core/                # 核心功能
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── cache.py
│   │   ├── security.py
│   │   └── vector_store.py
│   │
│   └── utils/               # 工具函数
│       ├── __init__.py
│       ├── technical_indicators.py
│       └── feature_engineering.py
│
├── tests/                   # 测试
│   ├── __init__.py
│   ├── test_api.py
│   └── test_services.py
│
├── alembic/                 # 数据库迁移
│   ├── versions/
│   └── env.py
│
├── requirements.txt         # Python 依赖
└── pyproject.toml          # 项目配置
```

### 初始化后端项目

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境（Windows）
venv\Scripts\activate

# 创建 requirements.txt
```

### requirements.txt

```txt
# FastAPI
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9  # PostgreSQL
asyncpg==0.29.0         # Async PostgreSQL

# Redis
redis==5.0.1
aioredis==2.0.1

# AI/ML
openai==1.3.5
langchain==0.0.340
qdrant-client==1.6.9

# ML
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
ta==0.11.0              # Technical Analysis

# Binance
python-binance==1.0.19

# Utilities
pydantic==2.5.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
python-jose[cryptography]==3.3.0  # JWT
passlib[bcrypt]==1.7.4             # Password hashing
httpx==0.25.1
aiofiles==23.2.1

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0

# Development
black==23.11.0          # Code formatting
flake8==6.1.0          # Linting
mypy==1.7.1            # Type checking
```

安装依赖:
```bash
pip install -r requirements.txt
```

### 项目配置

```python
# app/config.py

from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_NAME: str = "CryptoSage AI"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # API
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./cryptosage.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Binance (可选)
    BINANCE_API_KEY: str = ""
    BINANCE_SECRET_KEY: str = ""

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### FastAPI 入口

```python
# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import chat, prediction, market, news

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 前端 URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由
app.include_router(chat.router, prefix=f"{settings.API_V1_PREFIX}/chat", tags=["chat"])
app.include_router(prediction.router, prefix=f"{settings.API_V1_PREFIX}/predictions", tags=["predictions"])
app.include_router(market.router, prefix=f"{settings.API_V1_PREFIX}/market", tags=["market"])
app.include_router(news.router, prefix=f"{settings.API_V1_PREFIX}/news", tags=["news"])

@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### 运行开发服务器

```bash
# 确保虚拟环境已激活
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问:
- API: http://localhost:8000
- 交互式文档: http://localhost:8000/docs
- 备用文档: http://localhost:8000/redoc

---

## 🗄️ 数据库管理

### 使用 Alembic 管理迁移

```bash
cd backend

# 初始化 Alembic（如果还没有）
alembic init alembic

# 编辑 alembic.ini
# sqlalchemy.url = postgresql://postgres:postgres@localhost:5432/cryptosage

# 编辑 alembic/env.py
# from app.models import Base
# target_metadata = Base.metadata

# 创建迁移
alembic revision --autogenerate -m "create initial tables"

# 查看当前版本
alembic current

# 执行迁移
alembic upgrade head

# 回滚一个版本
alembic downgrade -1

# 查看迁移历史
alembic history
```

### 数据库连接

```python
# app/core/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 依赖注入
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### MVP 简化：使用 SQLite

在开发初期，可以使用 SQLite：

```python
# .env
DATABASE_URL=sqlite:///./cryptosage.db

# app/core/database.py
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite only
)
```

---

## 🧪 测试

### 后端测试

```python
# tests/test_api.py

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "name" in response.json()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_prediction():
    response = client.get("/api/v1/predictions/BTCUSDT?timeframe=1h")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "predicted_price" in data["data"]
```

运行测试:
```bash
# 安装 pytest
pip install pytest pytest-asyncio pytest-cov

# 运行所有测试
pytest

# 运行并显示覆盖率
pytest --cov=app tests/

# 运行特定测试
pytest tests/test_api.py::test_root
```

### 前端测试

```bash
# 安装 Jest 和 Testing Library
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# 运行测试
npm test
```

---

## 🔧 常见问题

### 1. Docker 启动失败

**问题**: `Error: Bind for 0.0.0.0:5432 failed: port is already allocated`

**解决**:
```bash
# 查看占用端口的进程
netstat -ano | findstr :5432

# 停止占用端口的服务，或修改 docker-compose.yml 中的端口映射
ports:
  - "5433:5432"  # 本地 5433 -> 容器 5432
```

### 2. Python 虚拟环境激活失败

**问题**: Windows PowerShell 执行策略限制

**解决**:
```powershell
# 以管理员身份运行 PowerShell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# 或使用 CMD
venv\Scripts\activate.bat
```

### 3. OpenAI API 请求失败

**问题**: `openai.error.RateLimitError`

**解决**:
```python
# 添加重试逻辑
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(wait=wait_exponential(multiplier=1, min=4, max=10), stop=stop_after_attempt(3))
async def call_openai_api(...):
    # API 调用
    pass
```

### 4. 前端 API 调用 CORS 错误

**问题**: `Access to fetch at '...' from origin 'http://localhost:3000' has been blocked by CORS`

**解决**:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 5. 数据库连接失败

**问题**: `could not connect to server: Connection refused`

**解决**:
```bash
# 检查 Docker 容器状态
docker-compose ps

# 查看 PostgreSQL 日志
docker-compose logs postgres

# 重启数据库
docker-compose restart postgres
```

---

## 📝 代码规范

### Python (Black + Flake8)

```bash
# 格式化代码
black app/ tests/

# Linting
flake8 app/ tests/

# 类型检查
mypy app/
```

### TypeScript (ESLint + Prettier)

```bash
# Linting
npm run lint

# 格式化
npm run format
```

### Git Commit 规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
test: 测试
chore: 构建/工具链
```

示例:
```bash
git commit -m "feat: add price prediction API"
git commit -m "fix: resolve CORS issue in chat endpoint"
```

---

## 🔄 开发工作流

### 1. 功能开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/price-prediction

# 2. 开发功能
# 编写代码...

# 3. 测试
pytest  # 后端
npm test  # 前端

# 4. 提交
git add .
git commit -m "feat: implement price prediction service"

# 5. 推送
git push origin feature/price-prediction

# 6. 创建 Pull Request
```

### 2. 日常开发

```bash
# 1. 启动 Docker 服务
docker-compose up -d postgres redis qdrant

# 2. 启动后端（终端 1）
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload

# 3. 启动前端（终端 2）
cd frontend
npm run dev

# 4. 开始开发！
```

### 3. 停止开发

```bash
# Ctrl+C 停止前后端服务

# 停止 Docker
docker-compose down
```

---

## 📚 学习资源

### FastAPI
- 官方文档: https://fastapi.tiangolo.com/
- 教程: https://fastapi.tiangolo.com/tutorial/

### Next.js
- 官方文档: https://nextjs.org/docs
- Learn Next.js: https://nextjs.org/learn

### LangChain
- 文档: https://python.langchain.com/docs/get_started/introduction

### FinRL
- GitHub: https://github.com/AI4Finance-Foundation/FinRL
- 文档: https://finrl.readthedocs.io/

---

## 📞 获取帮助

遇到问题？
1. 查看 [常见问题](#常见问题)
2. 查看项目 Issues: https://github.com/yourusername/cryptosage/issues
3. 查阅相关文档

**下一步**: 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解如何部署到生产环境
