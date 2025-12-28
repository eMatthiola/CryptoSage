# CryptoSage AI - Deployment Guide

## ✅ Pre-Deployment Checklist

### Files Created
- [x] `backend/Procfile` - Railway/Heroku deployment config
- [x] `backend/railway.json` - Railway-specific configuration
- [x] `backend/runtime.txt` - Python version specification
- [x] `vercel.json` - Vercel frontend configuration
- [x] `.gitignore` - Sensitive files protection

### Security Verification
- [x] `.env` files ignored by Git
- [x] OpenAI API key configured locally
- [x] Strong SECRET_KEY generated
- [x] No hardcoded credentials in code
- [x] CORS properly configured

### Code Quality
- [x] Backend syntax check passed
- [x] Frontend TypeScript compilation clean
- [x] All imports working correctly
- [x] Logging system fully migrated
- [x] Frontend-backend communication verified

---

## 🚀 Deployment Steps

### 1. Backend Deployment (Railway)

#### Step 1.1: Push to GitHub
```bash
# Add remote if not already done
git remote add origin https://github.com/eMatthiola/CryptoSage.git

# Add all files (excluding .env due to .gitignore)
git add .

# Commit
git commit -m "Initial deployment setup

- Add logging system
- Configure environment variables
- Add Railway and Vercel deployment files
- Fix all frontend/backend imports"

# Push to GitHub
git push -u origin main
```

#### Step 1.2: Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `eMatthiola/CryptoSage`
4. Railway will auto-detect the backend (Python/FastAPI)

#### Step 1.3: Configure Backend Environment Variables

In Railway dashboard, add these environment variables:

```bash
# Required
OPENAI_API_KEY=sk-proj-UEeK... (your actual key)
OPENAI_MODEL=gpt-4o-mini

# Security
SECRET_KEY=m80tChcWIwgqroVJ8MMGasZp9hUMWAhw3iJlQO4HkQ4

# Production Settings
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Database (Railway provides PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-injected by Railway

# CORS - Add your Vercel domain after frontend deployment
CORS_ORIGINS=https://your-app.vercel.app

# Optional
BINANCE_API_KEY=
BINANCE_SECRET_KEY=
DAILY_REQUEST_LIMIT=30

# Redis (if using Railway Redis addon)
REDIS_URL=${{Redis.REDIS_URL}}  # Auto-injected

# Qdrant (optional - for later)
QDRANT_URL=
```

#### Step 1.4: Add Railway Services
1. **PostgreSQL** (Recommended):
   - In Railway project, click "+ New"
   - Add "PostgreSQL" database
   - DATABASE_URL will auto-inject

2. **Redis** (Optional but recommended):
   - Click "+ New"
   - Add "Redis"
   - REDIS_URL will auto-inject

#### Step 1.5: Verify Backend Deployment
- Railway will auto-deploy
- Check logs for: `Starting CryptoSage AI v0.1.0`
- Visit: `https://your-backend.up.railway.app/docs`
- Test health endpoint: `https://your-backend.up.railway.app/`

---

### 2. Frontend Deployment (Vercel)

#### Step 2.1: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import `eMatthiola/CryptoSage` from GitHub
4. Vercel will auto-detect Next.js

#### Step 2.2: Configure Build Settings
Vercel should auto-configure, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

#### Step 2.3: Configure Frontend Environment Variables

In Vercel project settings → Environment Variables:

```bash
# Required - Use your Railway backend URL
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.up.railway.app
```

#### Step 2.4: Update Backend CORS

Go back to Railway → Backend → Environment Variables:
- Update `CORS_ORIGINS` to include your Vercel URL:
```bash
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app
```

#### Step 2.5: Redeploy Backend
- In Railway, click "Deploy" to apply new CORS settings

#### Step 2.6: Verify Frontend Deployment
- Visit: `https://your-app.vercel.app`
- Check Market Overview loads data
- Check Price Chart displays
- Test Chat Assistant

---

## 🔧 Post-Deployment Configuration

### Database Initialization
SSH into Railway backend (or use Railway's console):
```bash
# Railway will auto-run migrations on deploy
# If manual migration needed:
cd backend
alembic upgrade head
```

### Monitor Logs
- **Railway**: Dashboard → Deployments → View Logs
- **Vercel**: Dashboard → Deployments → Function Logs

### Set Up Custom Domain (Optional)
1. **Frontend (Vercel)**:
   - Settings → Domains → Add Domain
   - Point DNS to Vercel

2. **Backend (Railway)**:
   - Settings → Domains → Generate Domain
   - Or add custom domain

---

## 📊 Environment Variables Summary

### Backend (Railway)
| Variable | Required | Example |
|----------|----------|---------|
| `OPENAI_API_KEY` | ✅ Yes | `sk-proj-...` |
| `SECRET_KEY` | ✅ Yes | Auto-generated |
| `CORS_ORIGINS` | ✅ Yes | `https://your-app.vercel.app` |
| `ENVIRONMENT` | ✅ Yes | `production` |
| `DEBUG` | ✅ Yes | `false` |
| `DATABASE_URL` | Auto | Railway provides |
| `REDIS_URL` | Optional | Railway provides |
| `BINANCE_API_KEY` | Optional | Leave empty |
| `DAILY_REQUEST_LIMIT` | Optional | `30` |

### Frontend (Vercel)
| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | `https://backend.railway.app` |
| `NEXT_PUBLIC_WS_URL` | ✅ Yes | `wss://backend.railway.app` |

---

## 🛡️ Security Checklist

- [ ] `.env` files not committed to Git
- [ ] `DEBUG=false` in production
- [ ] `CORS_ORIGINS` set to specific domains (not `*`)
- [ ] `SECRET_KEY` is strong and random
- [ ] API keys secured in platform env vars
- [ ] Rate limiting enabled (`DAILY_REQUEST_LIMIT`)
- [ ] HTTPS enforced (Railway/Vercel auto-handle)

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
1. Check `NEXT_PUBLIC_API_URL` in Vercel env vars
2. Verify CORS includes Vercel domain in Railway
3. Check Railway backend logs for errors

### Backend fails to start
1. Check Railway logs for errors
2. Verify `OPENAI_API_KEY` is set
3. Check database connection
4. Ensure Python 3.12.5 in `runtime.txt`

### Database errors
1. Check `DATABASE_URL` is set in Railway
2. Run migrations: `alembic upgrade head`
3. Check PostgreSQL addon status

### Rate limit issues
1. Verify `DAILY_REQUEST_LIMIT` is set
2. Check Redis connection (if using Redis)
3. Review middleware logs

---

## 📈 Monitoring & Maintenance

### Health Checks
- Backend: `https://your-backend.railway.app/health`
- Frontend: Load homepage and check for errors

### Log Monitoring
- Railway: Dashboard → Logs
- Vercel: Dashboard → Functions → Logs

### Database Backup (Railway)
- Automatic backups enabled by default
- Manual backup: Railway Dashboard → PostgreSQL → Backups

### Scheduled Tasks
Backend scheduler auto-runs:
- News collection: Every 30 minutes
- Database cleanup: Daily at 3 AM UTC

---

## 🚦 Production vs Development

### Development (.env)
```bash
ENVIRONMENT=development
DEBUG=true
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=sqlite:///./cryptosage.db
```

### Production (Railway/Vercel)
```bash
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://your-app.vercel.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

---

## 📝 Deployment Commands Reference

### Backend (Railway)
```bash
# Auto-deployed from GitHub
# Manual trigger: git push origin main
```

### Frontend (Vercel)
```bash
# Auto-deployed from GitHub
# Manual deploy: vercel --prod
```

### Database Migrations
```bash
# Generate migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

---

## ✅ Deployment Verification

After deployment, verify:
1. [ ] Backend health check returns 200
2. [ ] Frontend loads without errors
3. [ ] Market data displays correctly
4. [ ] Chat assistant responds
5. [ ] WebSocket connection works
6. [ ] News feed updates
7. [ ] No console errors in browser
8. [ ] API rate limiting works

---

**Deployment Date**: 2025-12-27
**Status**: Ready for deployment
**Platform**: Railway (Backend) + Vercel (Frontend)
