# AI-Proctored Exam Platform

A full-stack AI-Proctored Examination & Assessment Platform built with Next.js 14 and FastAPI.

## 🚀 Tech Stack
- **Frontend**: Next.js 14 + TypeScript + PWA
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **AI**: TensorFlow.js (BlazeNet, COCO-SSD) for proctoring

## 🌐 Vercel Deployment (Frontend)

The frontend deploys to Vercel automatically from GitHub.

### Environment Variables (add in Vercel Dashboard):
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Your deployed backend URL (e.g. `https://your-backend.onrender.com`) |

## 🖥️ Backend Deployment (Render)

Deploy the `backend/` folder to [Render.com](https://render.com):
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## 💻 Local Development

```bash
# Backend
cd backend
python -m uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
