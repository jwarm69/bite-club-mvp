# 🚀 Bite Club Deployment Guide

## Quick Deploy to Railway

### 1. Prerequisites
- GitHub account
- Railway account (free at railway.app)
- Your environment variables ready

### 2. Deploy Steps

#### A. Push to GitHub
```bash
# If you haven't already:
gh repo create bite-club-mvp --public
git remote add origin https://github.com/YOUR_USERNAME/bite-club-mvp.git
git push -u origin main
```

#### B. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select your `bite-club-mvp` repository
4. Railway will auto-detect Docker configuration

#### C. Set Environment Variables
In Railway dashboard, add these variables:
```
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=your_secure_jwt_secret
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### D. Deploy Services
Railway will create:
- **Backend service** (from backend/Dockerfile)
- **Frontend service** (from frontend/Dockerfile)
- **Redis service** (for caching)

### 3. Custom Domain (Optional)
- Add your domain in Railway dashboard
- Point DNS to Railway's provided URL
- SSL certificates are automatic

## Production URLs
- **Frontend**: https://bite-club-frontend.railway.app
- **Backend API**: https://bite-club-backend.railway.app
- **Admin Panel**: https://bite-club-frontend.railway.app/admin

## Monitoring
- Railway provides built-in metrics
- Add Sentry for error tracking
- Set up uptime monitoring

## Scaling
- Railway auto-scales based on traffic
- Upgrade plan as you grow
- Database (Supabase) scales independently

## Support
- Railway docs: [docs.railway.app](https://docs.railway.app)
- Bite Club issues: Create GitHub issue

---
*Deployed with Railway + Docker 🚀*