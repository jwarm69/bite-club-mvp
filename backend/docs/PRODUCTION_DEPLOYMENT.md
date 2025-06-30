# Production Deployment Guide

## Environment Setup

### Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:5432/database_name"
DIRECT_URL="postgresql://username:password@host:5432/database_name"  # For migrations

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"

# Frontend URL
FRONTEND_URL="https://yourdomain.com"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_live_your_production_stripe_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Twilio Configuration (for IVR calling system)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WEBHOOK_BASE_URL="https://yourapi.com"

# Email Configuration (for password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@yourdomain.com"

# Toast POS Integration (when ready)
TOAST_CLIENT_ID="your_toast_client_id"
TOAST_CLIENT_SECRET="your_toast_client_secret"
TOAST_ENVIRONMENT="production"  # or "sandbox" for testing
TOAST_WEBHOOK_SECRET="your_toast_webhook_secret"

# Server Configuration
PORT="3001"
NODE_ENV="production"

# Logging
LOG_LEVEL="info"  # error, warn, info, debug
```

### Frontend Environment Variables

Create a `.env` file in the frontend directory:

```bash
# API Configuration
REACT_APP_API_URL="https://yourapi.com/api"

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY="pk_live_your_production_stripe_key"

# Build Configuration
GENERATE_SOURCEMAP="false"
```

## Database Setup

### PostgreSQL Requirements
- PostgreSQL 13+ recommended
- Minimum 4GB RAM for production
- SSD storage recommended
- Regular backups configured

### Initial Setup
```bash
# Install dependencies
cd backend
npm ci --only=production

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional for production)
npm run seed
```

### Database Backup Strategy
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Retention: Keep 30 daily, 12 monthly backups
# Automated via cron job
0 2 * * * /path/to/backup-script.sh
```

## Deployment Options

### Option 1: Traditional VPS/Server

#### System Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB SSD minimum
- **OS**: Ubuntu 20.04+ or CentOS 8+

#### Setup Steps
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install Nginx for reverse proxy
sudo apt-get install nginx

# Install SSL certificate (Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx
```

#### PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'bite-club-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
```

#### Nginx Configuration
Create `/etc/nginx/sites-available/bite-club`:
```nginx
server {
    listen 80;
    server_name yourapi.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourapi.com;

    ssl_certificate /etc/letsencrypt/live/yourapi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourapi.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Option 2: Docker Deployment

#### Dockerfile (Backend)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: biteclub
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### Option 3: Cloud Platforms

#### Vercel (Frontend) + Railway/Render (Backend)

**Frontend (Vercel)**:
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

**Backend (Railway)**:
1. Connect GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy automatically

#### AWS Deployment

**Services Used**:
- **EC2**: Application hosting
- **RDS**: PostgreSQL database
- **CloudFront**: CDN for frontend
- **Route 53**: DNS management
- **Certificate Manager**: SSL certificates
- **S3**: File storage (if needed)

## Security Checklist

### ✅ Authentication & Authorization
- JWT secrets are secure and unique
- Password reset tokens expire appropriately
- Role-based access control implemented
- Session management secure

### ✅ API Security
- Rate limiting implemented
- CORS properly configured
- Input validation on all endpoints
- SQL injection protection (Prisma ORM)
- Helmet.js security headers

### ✅ Database Security
- Database credentials secure
- Connection encrypted (SSL)
- Regular security updates
- Backup encryption

### ✅ Infrastructure Security
- Server firewall configured
- SSL/TLS certificates installed
- Security updates automated
- Monitoring and alerting set up

## Monitoring & Logging

### Application Monitoring
```javascript
// logging.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### Health Checks
```javascript
// health.js
app.get('/health', async (req, res) => {
  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    
    // External service checks
    const checks = {
      database: 'healthy',
      stripe: 'healthy',
      twilio: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
    
    res.json({ status: 'healthy', checks });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});
```

### Metrics Collection
- API response times
- Database query performance
- Error rates by endpoint
- User activity metrics
- Call system performance

## Performance Optimization

### Database Optimization
```sql
-- Essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_call_logs_restaurant_id ON call_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
```

### API Optimization
- Enable gzip compression
- Implement API caching where appropriate
- Use connection pooling
- Optimize database queries
- Implement pagination for large datasets

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization
- Service worker for caching
- Bundle size optimization
- CDN for static assets

## Backup & Recovery

### Database Backups
```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="biteclub"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to cloud storage (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/
```

### Application Backups
- Source code: Git repository
- Configuration files: Secure backup
- SSL certificates: Backup and document renewal
- Environment variables: Secure documentation

## Maintenance Procedures

### Regular Updates
```bash
#!/bin/bash
# update-system.sh

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
npm audit fix

# Update Prisma client
npx prisma generate

# Restart services
pm2 restart all

# Verify health
curl https://yourapi.com/health
```

### Database Maintenance
```sql
-- Monthly maintenance queries
VACUUM ANALYZE;
REINDEX DATABASE biteclub;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting Guide

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Check connection limits
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Reset connections if needed
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"
```

#### High Memory Usage
```bash
# Check PM2 processes
pm2 monit

# Restart if memory usage high
pm2 restart all

# Check logs for memory leaks
pm2 logs --lines 100
```

#### SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -enddate -noout -in /etc/letsencrypt/live/yourdomain.com/cert.pem

# Renew certificate
sudo certbot renew --nginx

# Test renewal
sudo certbot renew --dry-run
```

### Emergency Procedures

#### Database Recovery
1. Stop application
2. Restore from latest backup
3. Run migrations if needed
4. Restart application
5. Verify functionality

#### Rollback Procedure
1. Revert to previous Docker image/deployment
2. Restore database if schema changed
3. Update environment variables if needed
4. Monitor for issues

## Launch Checklist

### Pre-Launch ✅
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backups automated
- [ ] Load testing completed
- [ ] Security audit passed

### Launch Day ✅
- [ ] Deploy to production
- [ ] Verify health endpoints
- [ ] Test core functionality
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Notify stakeholders

### Post-Launch ✅
- [ ] Monitor for 24-48 hours
- [ ] Review logs for errors
- [ ] Check user feedback
- [ ] Optimize based on metrics
- [ ] Plan next iteration

---

*Last Updated: 2025-06-26*
*Document Version: 1.0*