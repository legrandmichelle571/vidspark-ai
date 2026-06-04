# ⚡ NEXT STEPS - What You Need To Do NOW

This file tells you **EXACTLY** what to do to get VidSpark AI working.

---

## 📋 Checklist - Do These In Order

### Step 1: Get Your Supabase Credentials ✅

**You already have a Supabase account!**
- URL: https://supabase.com/dashboard/project/fnhyskbisfbtjgblbiap

**DO THIS NOW:**

1. Go to https://supabase.com/dashboard/project/fnhyskbisfbtjgblbiap
2. Click **Settings → API** (left sidebar)
3. Copy these values to a text file:
   - **Project URL** → Save as `SUPABASE_URL`
   - **anon public** key → Save as `SUPABASE_ANON_KEY`
   - **service_role secret** key → Save as `SUPABASE_SERVICE_KEY`

**Example:**
```
SUPABASE_URL=https://fnhyskbisfbtjgblbiap.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 2: Create Database Tables ✅

**DO THIS NOW:**

1. Go to https://supabase.com/dashboard/project/fnhyskbisfbtjgblbiap
2. Click **SQL Editor** (left sidebar)
3. Click **New Query** button
4. Copy the ENTIRE content of `database/schema.sql` (in this folder)
5. Paste into the SQL editor
6. Click **Run** button
7. Wait for "Success" message (should show ✓)

**If you get an error:**
- Screenshot it and save
- Check that you're in the right project
- Try running one section at a time

---

### Step 3: Get Your Stripe Credentials ✅

**You already have a Stripe account!**
- URL: https://dashboard.stripe.com/acct_1TdfmsDrjmVkL2UD/test/dashboard

**DO THIS NOW:**

1. Go to https://dashboard.stripe.com/acct_1TdfmsDrjmVkL2UD/test/dashboard
2. Click **Developers** (top menu) → **API Keys**
3. Copy these:
   - **Publishable key** (starts with `pk_test_`) → Save as `STRIPE_PUBLIC_KEY`
   - **Secret key** (starts with `sk_test_`) → Save as `STRIPE_SECRET_KEY`

**Example:**
```
STRIPE_PUBLIC_KEY=pk_test_51TdfmsDrjmVkL2UD...
STRIPE_SECRET_KEY=sk_test_51TdfmsDrjmVkL2UD...
```

---

### Step 4: Create Stripe Products ✅

**Create the pricing tiers in Stripe:**

1. In Stripe dashboard, click **Products** (left sidebar)
2. Click **Create Product** button

**Create PRODUCT 1 - PRO Plan:**
- Name: `VidSpark Pro`
- Price: `9.99`
- Billing period: **Monthly** (IMPORTANT!)
- Click **Create product**
- Copy the **Price ID** (starts with `price_`) → Save as `STRIPE_PRICE_PRO`

**Create PRODUCT 2 - BUSINESS Plan:**
- Name: `VidSpark Business`
- Price: `29.99`
- Billing period: **Monthly** (IMPORTANT!)
- Click **Create product**
- Copy the **Price ID** → Save as `STRIPE_PRICE_BUSINESS`

**Example:**
```
STRIPE_PRICE_PRO=price_1TdfmsEwK2D9...
STRIPE_PRICE_BUSINESS=price_1TdfmsDJK3L9...
```

---

### Step 5: Setup Stripe Webhook ✅

**DO THIS LATER (after Railway setup):**

You need your Railway URL first. For now, skip this.
We'll come back to this in Step 8.

---

### Step 6: Get Google OAuth Credentials ⏭️

**You already have:**
```
Google Client ID: 665845815325-kguko2tbkji3e9ru9fopmi97qcb9qcvl.apps.googleusercontent.com
```

**DO THIS NOW:**

1. Go to https://console.cloud.google.com/credentials
2. Find the OAuth app you created
3. Click the app to edit it
4. Make sure these URLs are in **Authorized redirect URIs**:
   - `https://vidsparkpro.com/api/auth/google/callback`
   - `http://localhost:3001/api/auth/google/callback` (for testing)

If any are missing:
- Click **Edit** 
- Add missing URIs
- Click **Save**

---

### Step 7: Setup Railway ⏭️

**CREATE A NEW RAILWAY PROJECT:**

1. Go to https://railway.app
2. Sign in / Create account
3. Click **+ New Project**
4. Select **Deploy from GitHub repo**
5. Select your `VidSpark-AI-Backend` repository
6. Railway will auto-detect Node.js and start deploying
7. Wait for first deployment to complete
8. Once deployed, go to **Deployments** tab
9. Click the latest deployment
10. Copy the URL at the top (should be: `https://vidspark-ai-...railway.app`)
11. **Save this URL!** You'll need it for environment variables

---

### Step 8: Add Environment Variables to Railway ⏭️

**Once Railway has your code:**

1. In Railway, click your project
2. Go to **Variables** tab
3. Click **+ Add Variable** and add these one by one:

```
SUPABASE_URL=https://fnhyskbisfbtjgblbiap.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=YOUR_RANDOM_32_CHAR_STRING
JWT_REFRESH_SECRET=YOUR_RANDOM_32_CHAR_STRING_DIFFERENT
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
GOOGLE_CLIENT_ID=665845815325-kguko2tbkji3e9ru9fopmi97qcb9qcvl.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_SECRET
OPENAI_API_KEY=sk-proj-...
FRONTEND_URL=https://vidsparkpro.com
NODE_ENV=production
PORT=3001
```

**For JWT_SECRET & JWT_REFRESH_SECRET:**

Generate random strings (open Terminal/PowerShell and run):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output twice to use for each secret.

---

### Step 9: Configure Stripe Webhook ✅

**Now that you have your Railway URL:**

1. Go back to Stripe: https://dashboard.stripe.com/acct_1TdfmsDrjmVkL2UD/test/dashboard
2. Click **Developers** → **Webhooks**
3. Click **+ Add Endpoint** button
4. Endpoint URL: `https://YOUR_RAILWAY_URL/api/webhooks/stripe`
   - Replace `YOUR_RAILWAY_URL` with your actual Railway URL from Step 7
5. Events to send: Select these:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `charge.refunded`
6. Click **Add Endpoint**
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add to Railway variables: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

### Step 10: Test Your API ✅

**Check if everything is working:**

1. Wait 5 minutes for Railway to update with all variables
2. Go to: `https://YOUR_RAILWAY_URL/health`
3. Should see:
   ```json
   {
     "status": "ok",
     "version": "1.0.0",
     "environment": "production",
     "timestamp": "..."
   }
   ```

**If you get an error:**
- Wait a few minutes more
- Check Railway logs (Deployments → Latest → Logs)
- Verify all environment variables are set correctly

---

### Step 11: Test Authentication ✅

**Test signup and login:**

Using Postman or curl:

```bash
# SIGNUP
curl -X POST https://YOUR_RAILWAY_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'

# Should return:
{
  "success": true,
  "data": {
    "userId": "uuid...",
    "plan": "free",
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### Step 12: Test Payment Flow ✅

**Create a test subscription:**

```bash
# LOGIN first to get token
curl -X POST https://YOUR_RAILWAY_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Copy accessToken from response, then:

# CREATE CHECKOUT
curl -X POST https://YOUR_RAILWAY_URL/api/payments/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "plan": "pro"
  }'

# Should return:
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/pay/..."
  }
}
```

Open the `url` in your browser and use Stripe test card:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

After payment, check if user plan updated to "pro"!

---

## 🎯 What You Have Now

✅ **Complete Backend API** ready for production
✅ **Database** with 8+ tables, RLS, triggers
✅ **Authentication** with JWT + Google OAuth
✅ **Payment Processing** with Stripe webhooks
✅ **Admin Dashboard** endpoints
✅ **Error Handling** with custom error classes
✅ **Rate Limiting** and security headers
✅ **Full API Documentation** in README.md

---

## 🚀 What's Next

After testing:

1. **Update Frontend** to use your Railway URL instead of localhost
2. **Deploy Frontend** to Cloudflare Pages / Vercel / Railway
3. **Configure DNS** for your domain
4. **Setup Email** (optional - for password reset)
5. **Add Monitoring** (Sentry for error tracking)
6. **Go Live** 🎉

---

## 📞 If Something Doesn't Work

1. **Check Railway Logs**
   - Go to Railway dashboard
   - Click your project
   - Go to Deployments
   - Click latest deployment
   - Scroll to Logs section
   - Look for error messages

2. **Check Environment Variables**
   - Make sure all variables are set correctly
   - No typos in URLs
   - Check that Stripe keys start with `sk_test_` and `pk_test_`

3. **Check Supabase**
   - Verify database tables exist
   - Check RLS policies are enabled
   - Try running a test query

4. **Check Stripe**
   - Verify products are created
   - Check webhook endpoint is reachable
   - Look at webhook delivery logs

---

## 📚 Files You Should Know

- **README.md** - Complete project documentation
- **DEPLOYMENT_GUIDE.md** - Detailed deployment steps
- **.env.example** - All environment variables with descriptions
- **database/schema.sql** - Complete database schema
- **package.json** - All dependencies

---

## ✨ Summary

You now have a **production-ready SaaS backend** with:

- ✅ Authentication (email + Google OAuth)
- ✅ Subscription management (3 plans)
- ✅ Payment processing (Stripe)
- ✅ Video analysis (multi-provider AI)
- ✅ Admin dashboard
- ✅ Security (RLS, rate limiting, validation)
- ✅ Monitoring (Sentry support)

**Everything is ready to deploy to production!**

Follow the steps above and you'll have a working system in ~1 hour.

Good luck! 🚀
