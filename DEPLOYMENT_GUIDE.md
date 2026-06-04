# 🚀 VidSpark AI - Complete Deployment Guide

## Table of Contents

1. [Database Setup (Supabase)](#1-database-setup-supabase)
2. [Backend Deployment (Railway)](#2-backend-deployment-railway)
3. [Stripe Configuration](#3-stripe-configuration)
4. [Environment Variables](#4-environment-variables)
5. [Frontend Deployment](#5-frontend-deployment)
6. [Testing](#6-testing)
7. [Monitoring & Logs](#7-monitoring--logs)

---

## 1. Database Setup (Supabase)

### Step 1.1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New project"
3. Enter project name: `VidSpark-AI`
4. Select region closest to you
5. Create a secure password (save it!)
6. Click "Create new project"

### Step 1.2: Get Credentials

Once project is created:

1. Go to **Settings → API**
2. Copy these values (save them in a safe place):
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_KEY`

### Step 1.3: Execute Database Schema

1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Copy entire content from `database/schema.sql`
4. Paste into SQL editor
5. Click "Run" button
6. Wait for completion (should show "Success" message)

### Step 1.4: Enable Auth

1. Go to **Authentication → Providers**
2. Enable "Email" provider
3. Go to **Authentication → Google** 
4. Paste your Google OAuth credentials (see Stripe section below)

---

## 2. Backend Deployment (Railway)

### Step 2.1: Prepare Git Repository

```bash
# In E:\extension pro\VidSpark-AI-v1.0\

# Initialize git if not already done
git init

# Create .gitignore
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# Stage all files
git add .

# Create initial commit
git commit -m "Initial VidSpark AI backend setup"
```

### Step 2.2: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name: `VidSpark-AI-Backend`
3. Description: "VidSpark AI Backend API"
4. Make it **Private** (contains secrets!)
5. Click "Create repository"

### Step 2.3: Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/VidSpark-AI-Backend.git

# Push code
git branch -M main
git push -u origin main
```

### Step 2.4: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up / Login
3. Click "+ New Project"
4. Select "Deploy from GitHub repo"
5. Select your `VidSpark-AI-Backend` repository
6. Railway will auto-detect Node.js
7. Wait for first deployment

### Step 2.5: Add Environment Variables

In Railway dashboard:

1. Click on your project
2. Go to "Variables" tab
3. Add all variables from `.env` file:
   - `SUPABASE_URL=https://...`
   - `SUPABASE_ANON_KEY=...`
   - `SUPABASE_SERVICE_KEY=...`
   - `JWT_SECRET=` (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `JWT_REFRESH_SECRET=` (generate new one)
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_test_...`
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
   - `OPENAI_API_KEY=sk-proj-...`
   - etc.

4. Click "Save" button

### Step 2.6: Get Production URL

1. In Railway, go to "Deployments" tab
2. Find latest deployment, click it
3. Copy the URL at top (should be: `https://vidspark-ai-backend-production.up.railway.app`)
4. Save this URL for later!

---

## 3. Stripe Configuration

### Step 3.1: Create Stripe Products

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Login to test account
3. Go to "Products" section

**Create PRO Plan:**
- Name: "VidSpark Pro"
- Price: $9.99/month (set to monthly recurring)
- Click "Create product"
- Copy the **Price ID** (starts with `price_`)
- Save as `STRIPE_PRICE_PRO=price_...`

**Create BUSINESS Plan:**
- Name: "VidSpark Business"
- Price: $29.99/month (set to monthly recurring)
- Click "Create product"
- Copy the **Price ID**
- Save as `STRIPE_PRICE_BUSINESS=price_...`

### Step 3.2: Get Stripe Keys

1. Go to Stripe "Developers" → "API keys"
2. Copy **Publishable key** → `STRIPE_PUBLIC_KEY=pk_test_...`
3. Copy **Secret key** → `STRIPE_SECRET_KEY=sk_test_...`
4. Add to Railway environment variables

### Step 3.3: Configure Webhook

1. Go to Stripe "Developers" → "Webhooks"
2. Click "+ Add endpoint"
3. Endpoint URL: `https://YOUR_RAILWAY_URL/api/webhooks/stripe`
4. Events to send: select all payment events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `charge.refunded`
5. Click "Add endpoint"
6. Copy **Signing secret** (starts with `whsec_`)
7. Add to Railway: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## 4. Environment Variables

### Checklist of All Required Variables

```
NODE_ENV=production
PORT=3001

SUPABASE_URL=https://fnhyskbisfbtjgblbiap.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

JWT_SECRET=abc123... (32+ chars, use generator)
JWT_REFRESH_SECRET=def456... (32+ chars, use generator)
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800

GOOGLE_CLIENT_ID=665845815325-kguko2tbkji3e9ru9fopmi97qcb9qcvl.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=https://YOUR_RAILWAY_URL/api/auth/google/callback

STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...

OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...

FRONTEND_URL=https://vidsparkpro.com
```

### Where to get each variable:

| Variable | Source |
|----------|--------|
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role |
| `JWT_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Generate: same command, different result |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks |
| `OPENAI_API_KEY` | OpenAI → Account → API keys |

---

## 5. Frontend Deployment

### Step 5.1: Update Frontend with Backend URL

In your frontend code, replace all `localhost:3001` references:

```javascript
// Before:
const API_URL = 'http://localhost:3001/api';

// After:
const API_URL = 'https://YOUR_RAILWAY_URL/api';
```

Files to check:
- `admin/config.js` (line 12)
- `js/api.js` (line 10)
- `admin/api.js` (line 7)
- Any other files with `localhost` references

### Step 5.2: Deploy Frontend

Choose one option:

**Option A: Cloudflare Pages**
1. Connect GitHub repo to Cloudflare Pages
2. Set build command: `npm run build` (or none if static)
3. Set publish directory: `public` or `.`
4. Deploy!

**Option B: Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Set environment variables
4. Click "Deploy"

**Option C: Railway (with backend)**
1. Create Node.js static server to serve frontend
2. Deploy alongside backend

---

## 6. Testing

### Test 6.1: Health Check

```bash
curl https://YOUR_RAILWAY_URL/health

# Expected response:
{
  "status": "ok",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-06-04T..."
}
```

### Test 6.2: Authentication Flow

1. Go to frontend login page
2. Click "Sign in with Google"
3. Complete Google authentication
4. Should receive JWT tokens
5. Should be redirected to dashboard

### Test 6.3: Payment Flow

1. Login as test user
2. Go to billing page
3. Click "Upgrade to Pro"
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout
6. Should see success message
7. User plan should update to "pro"

### Test 6.4: Analysis Pipeline

1. Login
2. Upload/select a video
3. Click "Analyze"
4. Wait for completion (30-60 seconds)
5. See analysis results
6. Verify quota decreased by 10 (or plan limit amount)

---

## 7. Monitoring & Logs

### Railway Logs

1. Go to Railway dashboard
2. Click your project
3. Go to "Deployments" → Latest deployment
4. Scroll to "Logs" section
5. See real-time logs

### Error Tracking

Add Sentry for error tracking:

1. Go to [sentry.io](https://sentry.io)
2. Create new project
3. Select "Node.js" 
4. Copy DSN
5. Add to Railway: `SENTRY_DSN=https://...`

### Database Monitoring

In Supabase:

1. Go to "Monitoring" → "Replication lag"
2. Check for any issues
3. Go to "SQL" to run manual queries

### Performance

Monitor:
- API response times (should be <200ms)
- Database query times
- Stripe webhook delivery

---

## Quick Start Checklist

- [ ] Supabase project created
- [ ] Database schema executed
- [ ] GitHub repo created and code pushed
- [ ] Railway project created and connected
- [ ] Environment variables added to Railway
- [ ] Stripe products created
- [ ] Stripe webhook configured
- [ ] Frontend updated with production URLs
- [ ] Frontend deployed
- [ ] Health check passing
- [ ] Google OAuth working
- [ ] Payment flow tested
- [ ] Analysis pipeline working
- [ ] Monitoring configured

---

## Troubleshooting

### Problem: "Unauthorized" on API calls

**Solution:**
1. Check `SUPABASE_ANON_KEY` is correct
2. Check JWT token is being sent in Authorization header
3. Check token not expired

### Problem: Stripe webhook not working

**Solution:**
1. Check webhook URL is correct: `https://YOUR_DOMAIN/api/webhooks/stripe`
2. Check `STRIPE_WEBHOOK_SECRET` matches in Stripe dashboard
3. View webhook logs in Stripe dashboard

### Problem: Google OAuth failing

**Solution:**
1. Check `GOOGLE_CLIENT_ID` is correct
2. Check authorized origins in Google Cloud Console include your domain
3. Check `GOOGLE_CALLBACK_URL` is set correctly

### Problem: Database not accessible

**Solution:**
1. Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
2. Check Supabase project is not paused
3. Check RLS policies aren't blocking queries

---

## Support

If you encounter issues:

1. Check Railway logs for error messages
2. Check Supabase logs
3. Check Stripe webhook logs
4. Review this guide again
5. Check backend code in `src/` directory

Good luck! 🚀
