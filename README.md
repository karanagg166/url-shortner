# 🔗 URL Shortener

A full-stack URL shortener application with user authentication, link analytics, and a dashboard to manage shortened URLs.

Built with **Next.js 16** on the frontend and **FastAPI + GraphQL** on the backend, backed by **Supabase** for persistent storage and **Redis** for high-speed caching.

---

## ✨ Features

- **Shorten URLs** — Turn long URLs into compact, shareable short links
- **Custom Mapping Names** — Use custom aliases (e.g. `karan-resume`) with real-time availability checks and validation
- **User Authentication** — Register and login to manage your links
- **Dashboard** — View, manage, and track all your shortened URLs
- **GraphQL API** — Flexible, type-safe API powered by Strawberry GraphQL
- **Redis Caching** — Sub-millisecond redirect lookups via in-memory caching
- **Dark Mode** — Automatic dark/light theme support
- **Dockerized** — One-command setup with Docker Compose

---

## 🏗️ Architecture

```
┌─────────────────┐       GraphQL       ┌─────────────────┐
│                 │  ←───────────────→  │                 │
│   Next.js 16    │                     │    FastAPI       │
│   (Frontend)    │                     │    (Backend)     │
│   Port 3000     │                     │    Port 8000     │
│                 │                     │                 │
└─────────────────┘                     └────────┬────────┘
                                                 │
                                    ┌────────────┼────────────┐
                                    │            │            │
                              ┌─────▼─────┐ ┌───▼──────────┐
                              │   Redis   │ │   Supabase   │
                              │  (Cache)  │ │ (Database +  │
                              │ Port 6379 │ │    Auth)     │
                              └───────────┘ └──────────────┘
```

---

## 🛠️ Tech Stack

| Layer       | Technology                                                        |
| ----------- | ----------------------------------------------------------------- |
| Frontend    | [Next.js 16](https://nextjs.org/) · React 19 · TypeScript 7      |
| Styling     | [Tailwind CSS 4](https://tailwindcss.com/)                        |
| Backend     | [FastAPI](https://fastapi.tiangolo.com/) · Python 3.12            |
| API         | [Strawberry GraphQL](https://strawberry.rocks/)                   |
| Database    | [Supabase](https://supabase.com/) (Postgres + Auth)               |
| Cache       | [Redis 7](https://redis.io/)                                      |
| DevOps      | Docker · Docker Compose                                           |
| Package Mgr | pnpm 11 (frontend) · pip (backend)                                |

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (recommended)
- Or for local dev: [Node.js 24+](https://nodejs.org/), [pnpm 11+](https://pnpm.io/), [Python 3.12+](https://www.python.org/)
- A [Supabase](https://supabase.com/) project (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/karanagg166/url-shortner.git
cd url-shortner
```

### 2. Set up environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

```env
# Redis (defaults work with Docker Compose)
REDIS_HOST=redis
REDIS_PORT=6379

# PostgreSQL Connection String (Supabase)
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
```

### 3. Run with Docker Compose (recommended)

```bash
docker compose up --build
```

This spins up three services:

| Service    | URL                     |
| ---------- | ----------------------- |
| Frontend   | http://localhost:3000    |
| Backend    | http://localhost:8000    |
| GraphQL UI | http://localhost:8000/graphql |

### 4. Or run locally (without Docker)

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**

```bash
pnpm install
pnpm dev
```

> **Note:** When running locally, make sure Redis is running on `localhost:6379` and update `REDIS_HOST=localhost` in your `.env`.

---

## 📁 Project Structure

```
url-shortner/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── core/               # Config, Redis, Supabase clients
│   │   │   ├── config.py
│   │   │   ├── redis.py
│   │   │   └── supabase.py
│   │   ├── graphql/            # GraphQL schema, queries, mutations
│   │   │   ├── context.py
│   │   │   ├── mutations.py
│   │   │   ├── queries.py
│   │   │   ├── schema.py
│   │   │   └── types.py
│   │   ├── models/             # Pydantic data models
│   │   │   └── url.py
│   │   ├── services/           # Business logic
│   │   │   └── url_service.py
│   │   └── main.py             # FastAPI app entrypoint
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── src/                        # Next.js frontend
│   ├── app/
│   │   ├── dashboard/          # Dashboard with link management
│   │   │   └── links/          # Links sub-page
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   └── not-found.tsx       # 404 page
│   ├── components/
│   │   └── url/                # URL-related components
│   │       ├── UrlCard.tsx
│   │       ├── UrlForm.tsx
│   │       └── UrlTable.tsx
│   └── lib/                    # Utilities & API helpers
│       ├── api.ts
│       └── utils.ts
├── docker-compose.yml          # Multi-service orchestration
├── Dockerfile                  # Frontend container
├── package.json
├── tsconfig.json
├── tailwind / postcss configs
└── README.md
```

---

## 🔌 API

The backend exposes a **GraphQL** API at `/graphql`.

**Endpoint:** `POST http://localhost:8000/graphql`

**Health check:** `GET http://localhost:8000/health`

### Interactive Playground

Visit [http://localhost:8000/graphql](http://localhost:8000/graphql) in your browser for the built-in GraphiQL explorer, where you can run queries and mutations interactively.

### Example Query
 
```graphql
query {
  hello
}
```

### Custom Slug / Alias Availability

You can verify whether a custom mapping name (e.g. `karan-resume`) is available via REST or GraphQL:

**REST Endpoint:**
```http
GET http://localhost:8000/api/urls/check-availability?slug=karan-resume
```

**Response:**
```json
{
  "available": true,
  "slug": "karan-resume",
  "message": "Custom alias 'karan-resume' is available!",
  "reason": null
}
```

**GraphQL Query:**
```graphql
query CheckSlugAvailability {
  checkSlugAvailability(slug: "karan-resume") {
    available
    slug
    message
    reason
  }
}
```


---

## 🐳 Docker Services

| Container                  | Image            | Port  | Purpose                 |
| -------------------------- | ---------------- | ----- | ----------------------- |
| `url-shortener-frontend`   | Node 24 Alpine   | 3000  | Next.js dev server      |
| `url-shortener-backend`    | Python 3.12 Slim | 8000  | FastAPI + GraphQL       |
| `url-shortener-redis`      | Redis 7 Alpine   | 6379  | Caching layer           |

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop everything
docker compose down

# Rebuild after changes
docker compose up --build
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -m 'Add awesome feature'`)
4. Push to the branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
