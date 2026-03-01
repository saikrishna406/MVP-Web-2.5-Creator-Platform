# Rapid MVP Creator Platform ✨

A production-ready Web 2.5 creator monetization platform that simulates Web3 tokenomics using centralized infrastructure. Built for creators and fans to interact in a two-economy system.

## 🌟 Core Concept

The platform features a **Dual-Economy System**:
1. **Creator Tokens (💰):** A paid currency purchased via Stripe. Used to unlock premium content, support creators, and access token-gated or threshold-gated experiences.
2. **Engagement Points (⭐):** An earned currency generated through platform engagement (daily logins, likes, comments). Can be redeemed in the Creator Store for exclusive items and rewards.

## 🚀 Features

### For Creators
- **Creator Studio Dashboard:** Track tokens earned, active fans, and post performance.
- **Content Gating:** Create posts with flexible access controls:
  - *Public:* Open to everyone.
  - *Token-Gated:* Fans pay a specific token cost to unlock.
  - *Threshold-Gated:* Fans must hold a minimum token balance to view.
- **Redemption Store:** Create and manage custom items (shoutouts, merch, access) that fans can redeem using their earned Points.
- **Analytics:** Detailed insights into token revenue, fan leaderboards, and engagement metrics.

### For Fans
- **Interactive Feed:** Discover and interact with creator content (likes, comments).
- **Gamified Engagement:** Earn points daily and through active participation.
- **Virtual Wallet:** Track both Token and Point balances natively inside the platform.
- **Store & Redemptions:** Spend earned points on exclusive creator offerings.

## 🛠️ Technology Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL, Authentication)
- **Payments:** Stripe Checkout & Webhooks
- **Styling:** Custom UI with Lucide React icons, dark mode, and glassmorphism design.

## 🔒 Security & Architecture

- **Atomic Transactions:** All wallet operations (purchases, spending, point redemptions) are handled via robust Supabase PostgreSQL `SECURITY DEFINER` RPC functions to prevent double-spending and ensure ACID compliance.
- **Role-Based Access Control:** Secure routing and UI elements tailored to `creator` vs `fan` roles using Next.js Middleware.
- **Webhook Verification:** Secure Stripe webhook processing to reliably credit purchased tokens.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Project
- Stripe Account

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/saikrishna406/MVP-Web-2.5-Creator-Platform.git
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Setup Database
   - Navigate to your Supabase SQL editor.
   - Run the schema provided in `supabase/schema.sql` to initialize all tables, rows, policies, and atomic RPC functions.
4. Run Development Server
   ```bash
   npm run dev
   ```

## 🌐 Deployment

This project is optimized for deployment on **Vercel**. 
1. Push your code to your repository.
2. Import the project in Vercel.
3. Add all the required Environment Variables in the Vercel dashboard.
4. Deploy!

## 📜 License

This project is licensed under the MIT License.
