# CryptoSage AI

> Real-time Market Intelligence & Information Aggregation Platform

Real-time cryptocurrency market intelligence aggregation platform - helps you understand what's happening in the market, but does not provide investment advice.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-MVP%20Ready-green.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)

## Product Positioning

CryptoSage AI is an **information aggregation platform**, not an investment tool. We help users:
- Quickly detect market changes with real-time WebSocket push notifications
- Aggregate multi-source information: news, prices, order books, sentiment analysis in one place
- AI-powered insights to understand "what happened" and "why", not "what to do"
- Order book analysis for buy/sell pressure and large order detection (core differentiation)

## Core Features

### Market Radar (Real-time Market Monitoring)
Latest complete! WebSocket real-time push
- Change Snapshot: 1-hour price/volume/RSI comparison
- Anomaly Detection: Volume spikes, RSI extremes, price breakouts, rapid volatility
- Market Tempo: Volatility, activity, directional bias analysis
- Event Timeline: 24-hour important market events review
- Auto-reconnect: Automatic recovery on network disconnection (up to 5 retries)

### News Aggregation
- 4 Authoritative Sources: CoinDesk, Cointelegraph, Decrypt, The Block
- Smart Deduplication: Based on URL and title similarity
- Auto Classification: Categorized by coin (BTC, ETH, etc.)
- Relevance Scoring: Automatically rank most relevant news
- Scheduled Collection: Background automatic scraping, no manual refresh needed

### AI Intelligence (AI Assistant)
Information interpretation, not investment advice
- Role: Explain "what happened", provide background on "why it might happen"
- Multi-source Integration: Price data + news + order book + sentiment analysis
- Streaming Response: Real-time typing effect, ChatGPT-style experience
- RAG-enhanced: Based on real-time news, not fabrications
- Clear Limits: No buy/sell advice, no price predictions, no trading signals

### Real-time Market Data
- Binance Official Data: Millisecond latency
- Technical Indicators: RSI, MACD, Bollinger Bands, EMA
- Order Book Analysis (differentiation): Buy/sell pressure, spread, large order detection, depth strength
- 24h Statistics: High/low price, volume, price change percentage

### Sentiment Analysis
- Per-article Sentiment: Positive/Negative/Neutral
- Aggregated Sentiment: Overall sentiment statistics by coin
- Confidence Score: AI analysis credibility

## Technical Architecture

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

## Tech Stack

### Frontend
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- UI: Tailwind CSS + Shadcn/ui
- State Management: Zustand
- Charts: Recharts
- WebSocket: Socket.io-client

### Backend
- Framework: FastAPI
- Language: Python 3.11+
- AI: LangChain + OpenAI GPT-4o-mini
- ML: scikit-learn, pandas, numpy
- Async: asyncio, aiohttp
- WebSocket: Socket.io

### Data & Infrastructure
- Database: PostgreSQL 15
- Vector Store: Qdrant
- Cache: Redis
- Message Queue: Celery (optional)
- Containerization: Docker + Docker Compose

### External APIs
- Market Data: Binance API
- News Data: CoinDesk/CoinTelegraph RSS
- AI Model: OpenAI API

## Project Structure

```
cryptosage/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utility functions
│   ├── hooks/               # Custom Hooks
│   └── public/              # Static assets
│
├── backend/                 # FastAPI backend service
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── services/       # Business logic
│   │   │   ├── ai_service.py      # AI analysis
│   │   │   ├── ml_service.py      # ML prediction
│   │   │   └── market_service.py  # Market data
│   │   ├── models/         # Data models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── core/           # Core configuration
│   ├── tests/              # Unit tests
│   └── requirements.txt    # Python dependencies
│
├── docker/                  # Docker configuration
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
│
├── docs/                    # Project documentation
│   ├── ARCHITECTURE.md     # Architecture design
│   ├── API.md              # API documentation
│   ├── DATABASE.md         # Database design
│   ├── DEVELOPMENT.md      # Development guide
│   └── DEPLOYMENT.md       # Deployment guide
│
└── README.md               # This file
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- OpenAI API Key (required)
- Binance API Key (optional, public data used if not provided)

### Quick Launch (Recommended)

**Option 1: Using Launch Scripts** (Easiest)
```bash
# Start backend
start-backend.bat

# Start frontend (new terminal window)
start-frontend.bat
```

**Option 2: Manual Start**

1. **Configure Environment Variables**
```bash
# Edit backend/.env file
# At minimum, configure OPENAI_API_KEY
OPENAI_API_KEY=sk-your-openai-api-key
```

2. **Start Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. **Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

4. **Access Application**
- Frontend: http://localhost:3001 (or http://localhost:3000)
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Testing Integration

```bash
cd backend
venv\Scripts\activate

# Test OpenAI integration
python test_openai.py

# Test full integration (market data + AI)
python test_integration.py
```

For detailed guides, see:
- [START_HERE.md](START_HERE.md) - Beginner's guide
- [GETTING_STARTED.md](GETTING_STARTED.md) - Detailed development guide
- [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) - Current completion status

## Documentation

- Architecture Design (docs/ARCHITECTURE.md) - System architecture and design decisions
- API Documentation (docs/API.md) - RESTful API specification
- Database Design (docs/DATABASE.md) - Data models and schema
- Development Guide (docs/DEVELOPMENT.md) - Local development environment setup
- Deployment Guide (docs/DEPLOYMENT.md) - Production deployment

## Development Roadmap

### Phase 1: MVP (COMPLETED)
- [x] Project initialization
- [x] Technical architecture design
- [x] Intelligent dialogue feature (OpenAI GPT-4o-mini)
- [x] Real-time market data integration (Binance API)
- [x] Technical indicator analysis (RSI, MACD, Bollinger Bands, EMA)
- [x] Order book depth analysis (differentiation feature)
- [x] Responsive UI (Next.js 14 + Tailwind)
- [x] Streaming AI response

### Phase 2: Enhancement (In Progress)
- [ ] Basic price prediction (ML model)
- [ ] RAG news retrieval
- [ ] Multi-coin support expansion
- [ ] Historical conversation storage
- [ ] WebSocket real-time updates
- [ ] Performance optimization and caching

### Phase 3: Advanced (Future)
- [ ] User account system
- [ ] Custom trading strategies
- [ ] Mobile app
- [ ] Community features
- [ ] API subscription service

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md)

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details

## Disclaimer

**Important**: CryptoSage AI is for educational and research purposes only. All analysis, predictions, and suggestions provided by this tool do not constitute investment advice. Cryptocurrency trading carries high risk - you are responsible for your own investment decisions.

## Acknowledgments

This project is inspired by the following excellent open-source projects:
- [Chatbot UI](https://github.com/mckaywrigley/chatbot-ui) - Chat interface design
- [Quivr](https://github.com/QuivrHQ/quivr) - RAG architecture reference
- [FinRL](https://github.com/AI4Finance-Foundation/FinRL) - Financial machine learning
- [Perplexica](https://github.com/ItzCrazyKns/Perplexica) - Search and display

## Contact

- Author: [Your Name]
- Email: your.email@example.com
- Twitter: [@yourhandle]
- Project Homepage: https://github.com/yourusername/cryptosage

---

**If this project helps you, please give it a star!**
