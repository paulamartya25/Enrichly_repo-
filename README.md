# Job Automation Platform

A full-stack job automation platform where developers can create, schedule, and monitor automated jobs. Built for the Enrichly HR Full Stack Developer Intern Assignment.

## Live Demo

- **Frontend**: [https://enrichly-repo.vercel.app](https://enrichly-repo.vercel.app)
- **Backend API**: [https://enrichly-repo.onrender.com](https://enrichly-repo.onrender.com)
- **API Docs (Swagger)**: [https://enrichly-repo.onrender.com/swagger](https://enrichly-repo.onrender.com/swagger)

## GitHub Repository

[https://github.com/paulamartya25/Enrichly_repo-](https://github.com/paulamartya25/Enrichly_repo-)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) · React · TypeScript · TailwindCSS · shadcn/ui |
| Backend | ASP.NET Core 8 (C#) · Minimal APIs |
| Database | PostgreSQL 16 |
| Queue | PostgreSQL `SELECT FOR UPDATE SKIP LOCKED` |
| Auth | JWT (BCrypt password hashing) |
| Testing | xUnit · Testcontainers |
| Containerization | Docker · Docker Compose |

---

## Local Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- **OR**: [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) + [Node.js 20+](https://nodejs.org) + [PostgreSQL 16](https://www.postgresql.org/)

### Option A — Docker Compose (recommended)

```bash
git clone https://github.com/YOUR_USERNAME/enrichly-job-platform.git
cd enrichly-job-platform
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000).

### Option B — Manual

**1. Start PostgreSQL**
```bash
docker run -d \
  -e POSTGRES_DB=jobautomation \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

**2. Start the backend**
```bash
cd backend
cp .env.example .env   # edit values if needed
dotnet run --project src/JobAutomation.Api
# API available at http://localhost:5000
# Swagger UI at http://localhost:5000/swagger
```

**3. Start the frontend**
```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
# App available at http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env` or Render env vars)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `Host=db;Database=jobautomation;Username=postgres;Password=postgres` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | `your-super-secret-key-here-minimum` |
| `JWT_ISSUER` | JWT issuer | `jobautomation-api` |
| `JWT_AUDIENCE` | JWT audience | `jobautomation-frontend` |
| `WORKER_CONCURRENCY` | Parallel jobs per worker instance | `3` |
| `WORKER_POLL_INTERVAL_MS` | How often workers poll for queued jobs (ms) | `2000` |
| `ASPNETCORE_URLS` | Bind address | `http://+:5000` |

### Frontend (`frontend/.env.local` or Vercel env vars)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://your-backend.onrender.com` |

---

## Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repository
3. Set **Root Directory** to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
5. Deploy

### Backend + Database → Render

**Database:**
1. Go to [render.com](https://render.com) → New → PostgreSQL
2. Note the **Internal Database URL** and **External Database URL**

**Backend:**
1. New → Web Service → Connect your GitHub repo
2. Set **Root Directory** to `backend`
3. Set **Runtime** to Docker
4. Set environment variables (see table above, use the Render Internal DB URL for `DATABASE_URL`)
5. Deploy

**After deployment**, update `vercel.json` in the frontend with your actual Render backend URL.

---

## Running Tests

```bash
cd backend
dotnet test tests/JobAutomation.Tests/ --logger "console;verbosity=normal"
```

Tests use [Testcontainers](https://testcontainers.com/) — Docker must be running.

---

## API Documentation

Swagger UI is available at `/swagger` on the backend. The API uses JWT bearer authentication — click **Authorize** in Swagger and paste your token.
