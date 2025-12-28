# CryptoSage AI

> **Real-time Market Intelligence & Information Aggregation Platform**
>
> **快速感知市场变化 · 多源信息聚合 · AI 智能解读**

实时加密货币市场情报聚合平台 - 帮助你快速了解市场正在发生什么,但不提供投资建议。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-MVP%20Ready-green.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)

## 🎯 产品定位

CryptoSage AI 是一个**信息聚合平台**,而非投资工具。我们帮助用户:
- ⚡ **快速感知变化**：实时 WebSocket 推送市场异常和重要事件
- 📰 **聚合多源信息**：新闻、价格、订单簿、情感分析一站式呈现
- 🤖 **AI 智能解读**：理解"发生了什么"和"为什么",而非"该怎么做"
- 📊 **订单簿洞察**：买卖压力分析,大单检测(核心差异化)

## ✨ 核心功能

### 1️⃣ ⚡ Market Radar (实时市场雷达)
**最新完成!WebSocket 实时推送**
- **变化快照**: 1小时价格/成交量/RSI 变化对比
- **异常检测**: 成交量激增、RSI极值、价格突破、快速波动
- **市场节奏**: 波动性、活跃度、方向偏好分析
- **事件时间线**: 24小时重要市场事件回顾
- **自动重连**: 网络断开自动恢复(最多5次)

### 2️⃣ 📰 News Aggregation (新闻聚合)
- **4大权威来源**: CoinDesk, Cointelegraph, Decrypt, The Block
- **智能去重**: 基于 URL 和标题相似度
- **自动分类**: 按币种(BTC, ETH等)分类
- **相关性评分**: 自动排序最相关新闻
- **定时采集**: 后台自动抓取,无需手动刷新

### 3️⃣ 🤖 AI Intelligence (AI 智能助手)
**信息解读,非投资建议**
- **角色定位**: 解释"发生了什么",提供"为什么可能发生"的背景
- **多源整合**: 价格数据 + 新闻 + 订单簿 + 情感分析
- **流式响应**: 实时打字效果,ChatGPT风格体验
- **RAG增强**: 基于实时新闻而非空想编造
- **明确限制**: 不提供买卖建议,不预测价格,不生成交易信号

### 4️⃣ 📊 Real-time Market Data (实时市场数据)
- **Binance 官方数据**: 毫秒级延迟
- **技术指标**: RSI, MACD, 布林带, EMA
- **订单簿分析**(差异化): 买卖压力、价差、大单检测、深度强度
- **24h 统计**: 最高/最低价、成交量、涨跌幅

### 5️⃣ 💡 Sentiment Analysis (情感分析)
- **单篇情感**: 正面/负面/中性
- **聚合情感**: 按币种统计整体情绪
- **置信度评分**: AI 分析可信度

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                 │
│  ┌──────────────┬──────────────┬──────────────────────┐│
│  │ Chat Panel   │ Prediction   │   Market Overview    ││
│  │ (Streaming)  │ Dashboard    │   (Real-time)        ││
│  └──────────────┴──────────────┴──────────────────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │ REST API + WebSocket
┌──────────────────────┴──────────────────────────────────┐
│              Backend (FastAPI + Python 3.11)             │
│  ┌──────────────┬──────────────┬──────────────────────┐│
│  │ AI Service   │  ML Service  │  Market Data Service ││
│  │ (LangChain)  │  (FinRL)     │  (Binance API)       ││
│  └──────────────┴──────────────┴──────────────────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───▼────┐     ┌──────▼─────┐    ┌──────▼──────┐
│PostgreSQL│   │   Qdrant   │    │   Redis     │
│  Data    │   │   Vectors  │    │   Cache     │
└──────────┘   └────────────┘    └─────────────┘
```

## 🎨 技术栈

### Frontend
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **UI**: Tailwind CSS + Shadcn/ui
- **状态管理**: Zustand
- **图表**: Recharts
- **WebSocket**: Socket.io-client

### Backend
- **框架**: FastAPI
- **语言**: Python 3.11+
- **AI**: LangChain + OpenAI GPT-4o-mini
- **ML**: scikit-learn, pandas, numpy
- **异步**: asyncio, aiohttp
- **WebSocket**: Socket.io

### Data & Infrastructure
- **数据库**: PostgreSQL 15
- **向量存储**: Qdrant
- **缓存**: Redis
- **消息队列**: Celery (可选)
- **容器化**: Docker + Docker Compose

### External APIs
- **市场数据**: Binance API
- **新闻数据**: CoinDesk/CoinTelegraph RSS
- **AI模型**: OpenAI API

## 📦 项目结构

```
cryptosage/
├── frontend/                 # Next.js 前端应用
│   ├── app/                 # App Router 页面
│   ├── components/          # React 组件
│   ├── lib/                 # 工具函数
│   ├── hooks/               # 自定义 Hooks
│   └── public/              # 静态资源
│
├── backend/                 # FastAPI 后端服务
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── services/       # 业务逻辑
│   │   │   ├── ai_service.py      # AI 分析
│   │   │   ├── ml_service.py      # ML 预测
│   │   │   └── market_service.py  # 市场数据
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic schemas
│   │   └── core/           # 核心配置
│   ├── tests/              # 单元测试
│   └── requirements.txt    # Python 依赖
│
├── docker/                  # Docker 配置
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
│
├── docs/                    # 项目文档
│   ├── ARCHITECTURE.md     # 架构设计
│   ├── API.md              # API 文档
│   ├── DATABASE.md         # 数据库设计
│   ├── DEVELOPMENT.md      # 开发指南
│   └── DEPLOYMENT.md       # 部署指南
│
└── README.md               # 本文件
```

## 🚀 快速开始

### 前置要求
- Node.js 18+
- Python 3.11+
- OpenAI API Key (必需)
- Binance API Key (可选，不提供则使用公开数据)

### 快速启动 (推荐)

**方式 1: 使用启动脚本** (最简单)
```bash
# 启动后端
start-backend.bat

# 启动前端 (新终端窗口)
start-frontend.bat
```

**方式 2: 手动启动**

1. **配置环境变量**
```bash
# 编辑 backend/.env 文件
# 至少需要配置 OPENAI_API_KEY
OPENAI_API_KEY=sk-your-openai-api-key
```

2. **启动后端**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. **启动前端**
```bash
cd frontend
npm install
npm run dev
```

4. **访问应用**
- 前端: http://localhost:3001 (或 http://localhost:3000)
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

### 测试集成

```bash
cd backend
venv\Scripts\activate

# 测试 OpenAI 集成
python test_openai.py

# 测试完整集成 (市场数据 + AI)
python test_integration.py
```

详细指南请参考:
- [START_HERE.md](START_HERE.md) - 新手入门
- [GETTING_STARTED.md](GETTING_STARTED.md) - 详细开发指南
- [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) - 当前完成状态

## 📚 文档

- [🏗️ 架构设计](docs/ARCHITECTURE.md) - 系统架构和设计决策
- [🔌 API 文档](docs/API.md) - RESTful API 规范
- [💾 数据库设计](docs/DATABASE.md) - 数据模型和 Schema
- [💻 开发指南](docs/DEVELOPMENT.md) - 本地开发环境设置
- [🚀 部署指南](docs/DEPLOYMENT.md) - 生产环境部署

## 🎯 开发路线图

### ✅ Phase 1: MVP (COMPLETED!)
- [x] 项目初始化
- [x] 技术架构设计
- [x] 智能对话功能 (OpenAI GPT-4o-mini)
- [x] 实时市场数据集成 (Binance API)
- [x] 技术指标分析 (RSI, MACD, Bollinger Bands, EMA)
- [x] 订单簿深度分析 (差异化功能)
- [x] 响应式 UI (Next.js 14 + Tailwind)
- [x] Streaming AI 响应

### 🔄 Phase 2: Enhancement (In Progress)
- [ ] 基础价格预测 (ML 模型)
- [ ] RAG 新闻检索
- [ ] 多币种支持扩展
- [ ] 历史对话记录存储
- [ ] WebSocket 实时更新
- [ ] 性能优化和缓存

### 🔮 Phase 3: Advanced (Future)
- [ ] 用户账户系统
- [ ] 自定义交易策略
- [ ] 移动端 App
- [ ] 社区功能
- [ ] API 订阅服务

## 🤝 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## ⚠️ 免责声明

**重要**: CryptoSage AI 仅供教育和研究目的。本工具提供的所有分析、预测和建议均不构成投资建议。加密货币交易存在高风险，请自行承担投资决策的责任。

## 🙏 致谢

本项目受以下优秀开源项目启发：
- [Chatbot UI](https://github.com/mckaywrigley/chatbot-ui) - 聊天界面设计
- [Quivr](https://github.com/QuivrHQ/quivr) - RAG 架构参考
- [FinRL](https://github.com/AI4Finance-Foundation/FinRL) - 金融机器学习
- [Perplexica](https://github.com/ItzCrazyKns/Perplexica) - 搜索和展示

## 📧 联系方式

- 作者: [Your Name]
- Email: your.email@example.com
- Twitter: [@yourhandle]
- 项目主页: https://github.com/yourusername/cryptosage

---

**如果这个项目对你有帮助，请给个 ⭐️！**
