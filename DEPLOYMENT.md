# 🚀 Bite Club MVP Deployment Guide

This guide covers deploying the Bite Club MVP application to the internet using Docker containers.

## 📋 Prerequisites

- Docker and Docker Compose installed
- A production database (Supabase or PostgreSQL)
- Domain name (optional, can use Railway/Heroku provided domains)
- Stripe account with live API keys
- Email service credentials

## 🏗️ Production Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │   Database      │
│   (React/Nginx) │◄──►│  (Node.js/API)  │◄──►│  (Supabase)     │
│   Port 80       │    │   Port 3001     │    │   Remote        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         └───────────────────────┼───────────────────────
                                 │
                        ┌─────────────────┐
                        │     Redis       │
                        │  (In-Memory)    │
                        └─────────────────┘
```

## 🌐 Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. **Prepare Environment**
   ```bash
   cp .env.production.template .env.production
   # Edit .env.production with your actual values
   ```

2. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project
   railway init
   ```

3. **Deploy**
   ```bash
   # Deploy using Docker Compose
   railway up --detach
   ```

### Option 2: DigitalOcean App Platform

1. **Create App**
   - Connect GitHub repository
   - Select "Docker Compose" as build method
   - Configure environment variables

2. **Environment Variables**
   ```bash
   DATABASE_URL=your_supabase_connection_string
   JWT_SECRET=your_strong_jwt_secret
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   # ... other variables from .env.production.template
   ```

### Option 3: VPS Deployment (DigitalOcean Droplet)

1. **Server Setup**
   ```bash
   # On your VPS
   sudo apt update
   sudo apt install docker.io docker-compose-v2
   sudo usermod -aG docker $USER
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/bite-club-mvp.git
   cd bite-club-mvp
   
   # Configure environment
   cp .env.production.template .env.production
   # Edit .env.production
   
   # Deploy
   ./deploy.sh
   ```

## 🔧 Local Production Testing

Test your production build locally before deploying:

```bash
# 1. Configure environment
cp .env.production.template .env.production
# Edit with your production values

# 2. Build and deploy locally
./deploy.sh

# 3. Check status
./deploy.sh status

# 4. View logs
./deploy.sh logs

# 5. Stop when done testing
./deploy.sh stop
```

## 🔒 Security Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# JWT - MUST be strong in production
JWT_SECRET="your-super-strong-secret-min-32-chars"

# Stripe Live Keys
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# URLs - Update with your actual domains
FRONTEND_URL="https://yourdomain.com"
REACT_APP_API_URL="https://api.yourdomain.com/api"
```

### SSL/HTTPS Setup

For VPS deployments, use Traefik for automatic SSL:

```yaml
# Add to docker-compose.prod.yml
services:
  traefik:
    image: traefik:v2.9
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.myresolver.acme.email=your@email.com"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"

  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(\`yourdomain.com\`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=myresolver"
```

## 📊 Monitoring & Health Checks

The application includes built-in health checks:

- **Backend**: `http://localhost:3001/health`
- **Frontend**: `http://localhost/`
- **Automatic restarts** on failure

### View Application Status

```bash
# Container status
./deploy.sh status

# Application logs
./deploy.sh logs

# Health checks
./deploy.sh health
```

## 🔄 Deployment Workflow

### Initial Deployment

1. **Configure Environment**
   ```bash
   cp .env.production.template .env.production
   # Fill in all production values
   ```

2. **Deploy**
   ```bash
   ./deploy.sh deploy
   ```

### Updates & Maintenance

```bash
# Pull latest code
git pull origin main

# Redeploy with new code
./deploy.sh deploy

# Or just rebuild images
./deploy.sh build

# Restart without rebuilding
./deploy.sh restart
```

### Rollback Strategy

```bash
# Stop current deployment
./deploy.sh stop

# Switch to previous version
git checkout previous-working-commit

# Redeploy
./deploy.sh deploy
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check DATABASE_URL format
   postgresql://username:password@host:5432/database
   ```

2. **Frontend Can't Reach Backend**
   ```bash
   # Verify REACT_APP_API_URL in .env.production
   REACT_APP_API_URL="https://your-backend-domain.com/api"
   ```

3. **SSL Certificate Issues**
   ```bash
   # For Railway/Heroku: Automatic HTTPS
   # For VPS: Use Traefik or Cloudflare
   ```

### Debug Commands

```bash
# View detailed logs
docker compose -f docker-compose.prod.yml logs -f

# Execute commands in containers
docker compose -f docker-compose.prod.yml exec backend sh
docker compose -f docker-compose.prod.yml exec frontend sh

# Check environment variables
docker compose -f docker-compose.prod.yml exec backend printenv
```

## 💰 Cost Estimates

| Platform | Monthly Cost | Features |
|----------|-------------|----------|
| Railway | $5-20 | Auto-deployments, HTTPS, Monitoring |
| DigitalOcean App | $12-25 | Managed platform, Auto-scaling |
| VPS (Droplet) | $6-12 | Full control, Manual setup |
| Heroku | $7-25 | Easy setup, Add-ons available |

## 🎯 Production Checklist

- [ ] Production database configured
- [ ] All environment variables set
- [ ] Stripe live keys configured
- [ ] Domain name configured
- [ ] SSL/HTTPS enabled
- [ ] Health checks passing
- [ ] Monitoring/logging set up
- [ ] Backup strategy in place
- [ ] Error tracking configured (optional)

## 📞 Support

For deployment issues:

1. Check the deployment logs: `./deploy.sh logs`
2. Verify environment configuration
3. Test production build locally first
4. Review this deployment guide

## 🔗 Quick Links

- **Railway**: https://railway.app
- **DigitalOcean**: https://www.digitalocean.com/products/app-platform
- **Supabase**: https://supabase.com
- **Stripe**: https://stripe.com
- **Docker**: https://docs.docker.com