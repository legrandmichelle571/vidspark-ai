# 🎯 VidSpark AI - Production Backend

Complete, production-ready SaaS backend for YouTube video analysis with AI-powered insights.

## ✨ Features

✅ **Authentication**
- Email/Password signup & login
- Google OAuth 2.0 integration
- JWT-based session management
- Password reset & email verification

✅ **Subscription System**
- Freemium model (FREE, PRO, BUSINESS, ENTERPRISE)
- Monthly quota tracking
- Stripe payment integration
- Subscription webhooks

✅ **Video Analysis**
- Multi-provider AI (OpenAI, Claude, Gemini, DeepSeek)
- SEO, Engagement, Audience, Competitor analysis types
- Full async analysis pipeline
- PDF export of results

✅ **Payment Processing**
- Stripe checkout integration
- Recurring billing
- Refund management
- Payment history & invoicing

✅ **Admin Dashboard**
- User management
- Analytics & metrics
- Subscription management
- Manual quota adjustments

✅ **Security**
- Row-Level Security (RLS) policies on all tables
- Rate limiting (100 req/15 min per IP)
- CORS protection
- Helmet security headers
- Request validation & sanitization

✅ **Performance**
- Gzip compression
- Database query optimization with indexes
- Pagination on all list endpoints
- Caching strategy for quotas

---

## 📁 Project Structure

```
VidSpark-AI-v1.0/
├── server.js                    # Express server setup
├── package.json                 # Dependencies
├── .env.example                 # Environment variables template
├── DEPLOYMENT_GUIDE.md          # Complete deployment instructions
├── README.md                    # This file
│
├── src/
│   ├── config/
│   │   ├── supabase.js         # Supabase client initialization
│   │   └── stripe.js           # Stripe configuration
│   │
│   ├── controllers/
│   │   ├── authController.js   # Auth request handlers
│   │   └── analysisController.js # Analysis CRUD handlers
│   │
│   ├── middleware/
│   │   ├── auth.js             # JWT verification (requireAuth)
│   │   ├── permissions.js      # Role-based access control
│   │   ├── quota.js            # Quota checking & enforcement
│   │   └── validation.js       # Request validation
│   │
│   ├── routes/
│   │   ├── auth.js             # POST /signup, /login, /refresh, etc
│   │   ├── user.js             # GET /profile, PUT /profile
│   │   ├── admin.js            # Admin-only endpoints
│   │   ├── analytics.js        # Analytics data
│   │   ├── projects.js         # CRUD for projects
│   │   ├── analysis.js         # CRUD for analyses
│   │   ├── payments.js         # Payment endpoints
│   │   └── webhooks.js         # Stripe webhook handlers
│   │
│   ├── services/
│   │   ├── authService.js      # Auth business logic
│   │   ├── subscriptionService.js # Plan logic & quota management
│   │   ├── analysisService.js  # Analysis pipeline
│   │   ├── aiService.js        # Multi-provider AI abstraction
│   │   └── paymentService.js   # Stripe integration
│   │
│   └── utils/
│       ├── errors.js           # Custom error classes
│       └── validators.js       # Request validation schemas
│
└── database/
    └── schema.sql              # Complete PostgreSQL schema
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in all variables:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) below.

### 3. Setup Database

1. Create Supabase project (free at [supabase.com](https://supabase.com))
2. Copy Supabase credentials to `.env`
3. Execute `database/schema.sql` in Supabase SQL editor
4. Enable Google OAuth in Supabase

### 4. Start Development Server

```bash
npm start
```

Server runs on `http://localhost:3001`

Test with:
```bash
curl http://localhost:3001/health
```

---

## 🔐 Authentication

### Signup
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "plan": "free",
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### Google OAuth
```bash
POST /api/auth/google
Content-Type: application/json

{
  "token": "google_id_token"
}
```

### Refresh Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

---

## 💳 Subscription Plans

| Plan | Monthly Analyses | AI Reports | Max Channels | Price |
|------|-----------------|------------|-------------|-------|
| FREE | 10 | 0 | 1 | $0 |
| PRO | 500 | 100 | 10 | $9.99 |
| BUSINESS | 5,000 | 500 | 5 | $29.99 |
| ENTERPRISE | Unlimited | Unlimited | Unlimited | Custom |

### Upgrade Plan
```bash
POST /api/payments/checkout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "plan": "pro"
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

Redirect user to `url` for payment.

---

## 📊 Analysis API

### Create Analysis
```bash
POST /api/analysis
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "type": "full",
  "provider": "openai",
  "youtube_video_id": "dQw4w9WgXcQ"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "processing",
    "created_at": "2026-06-04T..."
  }
}
```

Returns immediately. Analysis happens asynchronously.

### Get Analysis
```bash
GET /api/analysis/{id}
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "seo_score": 85,
    "engagement_score": 72,
    "audience_score": 88,
    "competitor_score": 79,
    "overall_score": 81,
    "results": {...}
  }
}
```

### List Analyses
```bash
GET /api/analysis?page=1&limit=20
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

## 💰 Payment Integration

### Webhook Events

Stripe sends webhooks to `POST /api/webhooks/stripe`:

- `checkout.session.completed` → User subscription created
- `customer.subscription.updated` → Plan changed
- `customer.subscription.deleted` → Subscription cancelled
- `invoice.payment_succeeded` → Invoice paid
- `invoice.payment_failed` → Invoice failed
- `charge.refunded` → Refund processed

All webhook events:
1. Verify Stripe signature
2. Update database
3. Send confirmation to user (optional)

---

## 📈 Analytics Endpoints

### Get User Stats
```bash
GET /api/analytics/user-stats
Authorization: Bearer {accessToken}

Response:
{
  "total_analyses": 150,
  "total_videos": 42,
  "total_projects": 3,
  "subscription_status": "active",
  "monthly_usage": 8,
  "monthly_limit": 500
}
```

### Get Plan Usage
```bash
GET /api/user/quota
Authorization: Bearer {accessToken}

Response:
{
  "plan": "pro",
  "monthly_usage": 8,
  "monthly_limit": 500,
  "subscription_status": "active",
  "plan_expiration": "2026-07-04T...",
  "reset_date": "1st of next month"
}
```

---

## 🛠️ Environment Variables

### Required

```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# JWT
JWT_SECRET=your_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_32_chars

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Google OAuth
GOOGLE_CLIENT_ID=665845815325-kguko2tbkji3e9ru9fopmi97qcb9qcvl.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# OpenAI
OPENAI_API_KEY=sk-proj-...
```

### Optional

```env
# Other AI providers
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...

# Monitoring
SENTRY_DSN=https://...@sentry.io/PROJECT_ID

# Frontend
FRONTEND_URL=https://vidsparkpro.com
```

See `.env.example` for complete list.

---

## 🚀 Deployment

Follow the **complete deployment guide** in `DEPLOYMENT_GUIDE.md`:

### Quick Checklist

1. **Supabase Setup**
   - Create project
   - Execute schema.sql
   - Enable Google OAuth

2. **Railway Deployment**
   - Push code to GitHub
   - Connect GitHub to Railway
   - Add environment variables
   - Deploy!

3. **Stripe Configuration**
   - Create products (PRO, BUSINESS)
   - Configure webhook
   - Get API keys

4. **Frontend Updates**
   - Replace localhost URLs
   - Update API endpoints
   - Deploy frontend

---

## 📝 Database Schema

### Users Table
- `id` (UUID) - Primary key
- `email` (TEXT) - Unique email
- `name` (TEXT) - User name
- `plan` (TEXT) - Current plan (free/pro/business/enterprise)
- `monthly_usage` (INT) - Used analyses this month
- `monthly_limit` (INT) - Max analyses per plan
- `stripe_customer_id` (TEXT) - Stripe customer ID
- `plan_expires_at` (TIMESTAMP) - Subscription expiration

### Analyses Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `type` (TEXT) - Analysis type (seo/engagement/etc)
- `provider` (TEXT) - AI provider used
- `status` (TEXT) - pending/processing/completed
- `results` (JSONB) - Analysis results
- `seo_score`, `engagement_score`, etc. - Numeric scores

### Subscriptions Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `plan` (TEXT) - Plan type
- `status` (TEXT) - active/cancelled
- `stripe_subscription_id` (TEXT) - Stripe subscription
- `current_period_start/end` (TIMESTAMP) - Billing period

### Payments Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `stripe_payment_intent_id` (TEXT) - Stripe intent
- `amount` (INT) - Amount in cents
- `status` (TEXT) - pending/succeeded/failed
- `refunded` (BOOLEAN) - Is refunded

All tables have:
- Row-Level Security (RLS) for data isolation
- Indexes for query performance
- Timestamps (created_at, updated_at)

---

## 🔒 Security Features

✅ **Authentication**
- JWT tokens with expiration
- Refresh token rotation
- Password hashing (bcrypt)
- Email verification

✅ **Authorization**
- Row-Level Security on all tables
- Role-based access control (user/admin)
- Ownership verification on resources

✅ **API Security**
- CORS protection with whitelist
- Helmet security headers
- Rate limiting (100 req/15 min)
- Request validation & sanitization
- Input parameter validation

✅ **Data Protection**
- Encryption at rest (Supabase)
- Encryption in transit (HTTPS)
- Secure password reset flow
- PII data protection

---

## 🧪 Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3001/health

# Signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","name":"Test"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Get profile (requires token)
curl http://localhost:3001/api/user/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Stripe Testing

Use these test cards in Stripe dashboard:
- **Success**: `4242 4242 4242 4242`
- **Requires Authentication**: `4000 0027 6000 3184`
- **Declined**: `4000 0000 0000 0002`

---

## 📊 Monitoring

### Logs

View real-time logs in Railway dashboard:
- Deployments → Your project → Logs

### Errors

Set `SENTRY_DSN` for error tracking:
- Sentry will capture all exceptions
- Review in [sentry.io](https://sentry.io) dashboard

### Database

Monitor in Supabase:
- SQL Editor → Run queries
- Monitoring → View metrics
- Replication → Check lag

---

## 📚 API Documentation

### Endpoints

**Authentication**
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

**User**
- `GET /api/user/me` - Get profile
- `PUT /api/user/me` - Update profile
- `GET /api/user/quota` - Get quota info

**Analysis**
- `POST /api/analysis` - Create analysis
- `GET /api/analysis` - List analyses
- `GET /api/analysis/{id}` - Get analysis
- `DELETE /api/analysis/{id}` - Delete analysis

**Payments**
- `GET /api/payments/plans` - List plans
- `POST /api/payments/checkout` - Create checkout
- `GET /api/payments/history` - Payment history

**Projects**
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/{id}` - Get project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

---

## 🆘 Troubleshooting

### Database Connection Error
```
Error: SUPABASE_URL is not set
```
**Solution**: Add `SUPABASE_URL` to `.env` file

### Authentication Failing
```
Error: JWT verification failed
```
**Solution**: Check JWT_SECRET is correct, token not expired

### Stripe Webhook Not Working
```
Error: Invalid signature
```
**Solution**: Check STRIPE_WEBHOOK_SECRET matches in Stripe dashboard

### Rate Limit Exceeded
```
Error: Too many requests
```
**Solution**: Wait 15 minutes or increase rate limit in `server.js`

---

## 📞 Support

For detailed deployment instructions, see `DEPLOYMENT_GUIDE.md`

For issues:
1. Check error logs in Railway
2. Verify all environment variables
3. Check Supabase & Stripe dashboards
4. Review this README

---

## 📄 License

MIT License - See LICENSE file

---

## 🎉 Ready to Deploy?

Follow the **DEPLOYMENT_GUIDE.md** for step-by-step instructions to deploy to production!

Made with ❤️ for VidSpark AI
