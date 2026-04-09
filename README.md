# Agentic SOC Prototype

This repository contains a full-stack Security Operations Center simulator with a FastAPI backend and a cinematic React dashboard frontend.

## Project Structure

- `backend/` FastAPI API, detection agent logic, SQLite persistence
- `frontend/` Vite + React + Tailwind + Framer Motion dashboard UI

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on `http://127.0.0.1:8000`.

### API Endpoints

- `POST /generate-logs`
- `POST /analyze-log`
- `POST /analyze-batch`
- `GET /health`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and targets `http://127.0.0.1:8000` by default.

To override API URL:

```bash
echo "VITE_API_URL=http://127.0.0.1:8000" > frontend/.env
```
