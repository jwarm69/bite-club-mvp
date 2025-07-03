# 🐳 Docker Setup for Bite Club MVP

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Your existing Supabase database URL

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase database URL and API keys
# Make sure DATABASE_URL points to your Supabase database
```

### 2. Development Setup (with hot reloading)
```bash
# Start all services
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f
```

**Access your app:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Redis: localhost:6379

### 3. Production Testing
```bash
# Build and run production containers
docker-compose -f docker-compose.production.yml up --build

# Access production build at http://localhost
```

## Development Workflow

### Making Code Changes
- **Frontend**: Edit files in `./frontend/src/` - changes appear instantly
- **Backend**: Edit files in `./backend/src/` - changes appear instantly
- No need to rebuild containers during development!

### Database Operations
```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate dev

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Seed database
docker-compose exec backend npm run seed

# Open Prisma Studio
docker-compose exec backend npx prisma studio
```

### Useful Commands
```bash
# View running containers
docker-compose ps

# Stop all services
docker-compose down

# Rebuild containers (after Dockerfile changes)
docker-compose up --build

# View backend logs
docker-compose logs backend

# Shell into backend container
docker-compose exec backend sh

# Shell into frontend container
docker-compose exec frontend sh
```

## Services Overview

### Backend Container
- **Port**: 3001
- **Hot Reloading**: ✅ (via volume mounting)
- **Database**: Connects to your existing Supabase
- **Health Check**: http://localhost:3001/health

### Frontend Container
- **Port**: 3000 (dev) / 80 (production)
- **Hot Reloading**: ✅ (dev mode)
- **Build**: Optimized React build (production)
- **Proxy**: API calls proxied to backend

### Redis Container
- **Port**: 6379
- **Purpose**: Caching, session storage
- **Data**: Ephemeral (resets on container restart)

## Environment Variables

### Required
- `DATABASE_URL` - Your Supabase database connection string
- `JWT_SECRET` - Secure random string for authentication

### Optional (but recommended)
- `STRIPE_SECRET_KEY` - For payment processing
- `STRIPE_PUBLISHABLE_KEY` - For frontend Stripe integration
- `TWILIO_*` - For AI calling system
- `OPENAI_API_KEY` - For AI features

## Deployment Options

### Option 1: Railway
```bash
# Connect GitHub repo to Railway
# Set environment variables in Railway dashboard
# Automatic deployments on git push
```

### Option 2: Render
```bash
# Connect GitHub repo to Render
# Use docker-compose.production.yml
# Set environment variables in Render dashboard
```

### Option 3: Any Docker Host
```bash
# Copy docker-compose.production.yml to server
# Set environment variables
# Run: docker-compose -f docker-compose.production.yml up -d
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Stop containers and try again
docker-compose down
docker-compose up
```

**Database connection issues:**
```bash
# Check your DATABASE_URL in .env
# Ensure Supabase allows connections from Docker
```

**Node modules issues:**
```bash
# Rebuild containers
docker-compose down
docker-compose up --build
```

**Permission errors:**
```bash
# Reset Docker Desktop or restart Docker
```

### Performance Tips

1. **Allocate more memory to Docker** (4GB+ recommended)
2. **Use Docker Desktop's File Sharing settings** for better volume performance
3. **Close unnecessary applications** while running Docker

## Security Notes

- Containers run as non-root users
- Health checks ensure service availability
- Environment variables are properly isolated
- Production builds are optimized and secure

## What's Next?

Once Docker is working:
1. **Test all features** in the containerized environment
2. **Deploy to staging** using cloud platform
3. **Set up CI/CD pipeline** for automatic deployments
4. **Configure production monitoring** and logging

Your Bite Club app is now fully containerized and ready for deployment anywhere! 🚀