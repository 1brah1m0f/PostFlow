# PostFlow

Instagram post scheduler for small businesses.

## Stack
- Frontend: Next.js 14 + Tailwind
- Backend: FastAPI + SQLAlchemy + APScheduler
- Automation: Playwright (Chromium)
- DB: PostgreSQL (Docker)


## Setup

### 1. PostgreSQL
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
playwright install chromium

# Generate Fernet key (run once):
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Paste output into .env FERNET_KEY=...

uvicorn app.main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

API runs at http://localhost:8000  
Frontend runs at http://localhost:3000  
API docs at http://localhost:8000/docs

## Git Branch Strategy
```
main
└── dev
    ├── feature/frontend   (Developer A)
    └── feature/backend    (Developer B)
```

Never push directly to `main`. Open PR → `dev` → review → merge.  
Developer B owns `docker-compose.yml`.
