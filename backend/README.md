# Backend — Database & Infrastructure

This folder contains all backend infrastructure configuration, including database schemas and server-side setup.

## 📁 Structure

```
backend/
├── supabase/
│   └── schema.sql    # Full PostgreSQL database schema
└── README.md
```

## 🗄️ Database (Supabase)

The project uses **Supabase** as the backend-as-a-service (PostgreSQL database + Auth + Storage).

### Setup Instructions

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Navigate to **SQL Editor** in your Supabase dashboard
3. Open and run `supabase/schema.sql` to set up all tables, policies, and functions
4. Copy your project credentials to `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🔌 API Routes

All API routes live inside the Next.js app at `frontend/src/app/api/`:

| Route                          | Description                      |
|-------------------------------|----------------------------------|
| `/api/posts`                  | Creator posts CRUD               |
| `/api/wallet`                 | Fan wallet & balance             |
| `/api/stripe`                 | Stripe payment webhooks          |
| `/api/gamification`           | Points & rewards system          |
| `/api/redemption`             | Token redemption                 |

## 💳 Stripe Setup

Add your Stripe keys to `frontend/.env.local`:

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```
