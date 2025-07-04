# 🚀 Quick Render Deployment Guide

## Steps to Deploy

### 1. Update render.yaml
Edit the `render.yaml` file and replace:
```yaml
repo: https://github.com/jwarman69/bite-club-mvp.git
```
With your actual GitHub repository URL.

### 2. Push to GitHub
```bash
git add render.yaml RENDER_DEPLOY.md
git commit -m "Add Render deployment configuration"
git push origin main
```

### 3. Deploy in Render
1. Go back to Render and click **"Retry"**
2. Render will detect your `render.yaml` file
3. Review the configuration and click **"Apply"**

### 4. Update Environment Variables (Important!)
After deployment, update these in each service:

#### Backend Service:
- `STRIPE_SECRET_KEY`: Your actual Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
- `EMAIL_USER` & `EMAIL_PASS`: Your actual email credentials
- `OPENAI_API_KEY`: Your OpenAI API key (if using)

#### Frontend Service:
- `REACT_APP_STRIPE_PUBLISHABLE_KEY`: Your actual Stripe publishable key

### 5. Your Live URLs
After deployment:
- **Frontend**: `https://bite-club-frontend.onrender.com`
- **Backend API**: `https://bite-club-backend.onrender.com`
- **Admin Panel**: `https://bite-club-frontend.onrender.com/admin`

## Test Accounts
- **Admin**: admin@biteclub.com / admin123
- **Student**: student@fau.edu / student123
- **Restaurant**: pizza@fau.edu / restaurant123

## Notes
- First startup takes ~2 minutes
- Free tier services sleep after 15 mins of inactivity
- Upgrade to paid plans for production use

## Troubleshooting
If deployment fails:
1. Check the build logs in Render dashboard
2. Verify all environment variables are set
3. Make sure your GitHub repo is public or connected properly