# MVP Web 2.5 Creator Platform

A full-stack creator platform monorepo organized into clean `frontend` and `backend` directories.

## 📁 Project Structure

```
MVP-Web-2.5-Creator-Platform/
├── frontend/          # Next.js 16 application (UI + API Routes)
│   ├── src/
│   │   ├── app/       # Next.js App Router pages & API routes
│   │   ├── components/# Reusable React components
│   │   ├── lib/       # Shared utilities (Supabase client, Stripe, helpers)
│   │   ├── types/     # TypeScript type definitions
│   │   └── middleware.ts
│   ├── public/        # Static assets (SVGs, images)
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── ...
│
├── backend/           # Backend infrastructure & database
│   ├── supabase/
│   │   └── schema.sql # Database schema (PostgreSQL via Supabase)
│   └── README.md
│
└── README.md          # This file
```

## 🚀 Getting Started

### Frontend (Next.js App)

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000`

### Backend (Supabase)

See [`backend/README.md`](./backend/README.md) for database setup instructions.

## 🛠 Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | Next.js 16, React 19, TailwindCSS 4 |
| Language  | TypeScript 5                  |
| Database  | Supabase (PostgreSQL)         |
| Auth      | Supabase Auth + SSR           |
| Payments  | Stripe                        |
| Hosting   | Vercel (recommended)          |
