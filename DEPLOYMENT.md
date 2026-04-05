# 🚀 StyleGuru AI - Deployment Guide

## Overview
This is a monorepo with **Frontend** (React + Vite) and **Backend** (FastAPI + Python) that deploy to different platforms.

| Component | Platform | Auto-Deploy | Source |
|-----------|----------|-------------|--------|
| Frontend | Vercel | ✅ Yes | `/frontend` folder |
| Backend | Render | ✅ Yes | `/Backend` folder |
| Repository | GitHub | - | `styleguruai` |

---

## 📋 Deployment Checklist

### After **Frontend Changes**:
```bash
cd frontend
npm run build         # ✅ MUST PASS - no errors
cd ..
git add .
git commit -m "feat: description of changes"
git push origin main
# ⏳ Vercel deploys automatically (1-2 min)
```

### After **Backend Changes**:
```bash
# Test locally if possible
cd Backend
# python main.py (optional: test locally)
cd ..
git add .
git commit -m "feat: description of backend changes"
git push origin main
# ⏳ Render deploys automatically (2-5 min)
# ✅ Check: https://dashboard.render.com/web/srv-d7157e9r0fns73cap06g
```

### After **Both Frontend & Backend Changes**:
```bash
# 1. Build & test frontend first
cd frontend
npm run build
cd ..

# 2. Commit both changes
git add .
git commit -m "feat: frontend + backend improvements"
git push origin main

# 3. Verify both deployments
# - Vercel: https://styleguruai.vercel.app (1-2 min)
# - Render: Dashboard logs (2-5 min)
```

---

## ✅ Verification

### Frontend Deployment
- Check Vercel dashboard: https://vercel.com/vivek365u-oss/styleguruai
- Or visit: https://styleguruai.vercel.app
- Look for latest deployment timestamp

### Backend Deployment
- Check Render dashboard: https://dashboard.render.com/web/srv-d7157e9r0fns73cap06g
- Click "Events" to see deployment logs
- Test API: `curl https://your-backend-url/health`

---

## ⚠️ Important Rules

1. **Always commit locally first**: `git add . && git commit -m "..."`
2. **Always push after commits**: `git push origin main`
3. **Frontend must build**: Run `npm run build` before pushing frontend changes
4. **Backend must have valid Python**: Check `requirements.txt` and `Procfile`
5. **Wait for deployment**: Don't deploy both simultaneously, allow 5-10 min between checks

---

## 🔧 Troubleshooting

### Backend won't deploy
- Check `requirements.txt` has no syntax errors
- Check `Procfile` format: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- Check `runtime.txt`: `python-3.10.14`
- View Render logs for error details

### Frontend won't build
- Run locally: `cd frontend && npm run build`
- Check for ESLint errors: look for red error messages
- Fix TypeScript/JSX issues
- Commit and push again

### Changes not showing up
- **Frontend**: Hard refresh browser (Ctrl+Shift+R) or clear cache
- **Backend**: API might be cached, try new request with `?t=timestamp`
- Check deployment status in respective dashboards

---

## 📱 Current URLs

- **Frontend App**: https://styleguruai.vercel.app
- **Backend API**: (Check Render dashboard for live URL)
- **Repository**: https://github.com/vivek365u-oss/styleguruai

---

## 🚦 Deployment Flow Summary

```
Local Changes
    ↓
git add . && git commit -m "..."
    ↓
git push origin main
    ↓
GitHub receives push
    ↓
├─ Vercel detects /frontend changes → Auto-deploys frontend
│
└─ Render detects /Backend changes → Auto-deploys backend
    ↓
✅ Both services live within 5-10 minutes
```

---

**Last Updated**: April 5, 2026  
**Maintainer**: StyleGuru AI Team
