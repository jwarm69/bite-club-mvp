# 📊 Bite Club Monitoring Setup

## Quick Start

### 1. Start Monitoring Stack
```bash
# Start monitoring services
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Start your app
cd ..
docker-compose up -d
```

### 2. Access Dashboards
- **Grafana**: http://localhost:3030 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Uptime Kuma**: http://localhost:3001

## Error Tracking with Sentry

### 1. Sign up for Sentry
1. Go to [sentry.io](https://sentry.io)
2. Create free account
3. Create new project for "Bite Club"
4. Copy your DSN

### 2. Add Sentry to Environment
```bash
# Add to your .env file
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 3. Backend Integration
The backend is already configured for Sentry. Just add the DSN and restart:
```bash
docker-compose restart backend
```

### 4. Frontend Integration  
The frontend will automatically send errors to Sentry once configured.

## Alerts & Notifications

### 1. Set up Slack/Discord Webhooks
```bash
# Add to .env
ALERT_WEBHOOK_URL=https://hooks.slack.com/your-webhook
```

### 2. Configure Alert Rules
Edit `monitoring/alert_rules.yml` for custom alerts:
- High error rates
- Service downtime
- Performance issues
- Database problems

### 3. Uptime Monitoring
1. Open Uptime Kuma: http://localhost:3001
2. Add monitors for:
   - Frontend: http://localhost:3000
   - Backend Health: http://localhost:3001/health
   - External endpoints

## Production Monitoring

### 1. Railway Built-in Monitoring
- Resource usage graphs
- Request/response metrics
- Error rate tracking
- Deployment history

### 2. External Services
- **Sentry**: Error tracking and performance
- **LogRocket**: User session recording
- **Pingdom**: Uptime monitoring
- **DataDog**: Full observability (paid)

### 3. Custom Metrics
Your backend exposes metrics at `/metrics` endpoint:
- HTTP request counts
- Response times
- Database query times
- Custom business metrics

## Key Metrics to Watch

### 🚨 Critical Alerts
- **Service Down**: Backend/Frontend not responding
- **High Error Rate**: >5% 5xx errors
- **Database Issues**: Connection failures
- **Payment Failures**: Stripe webhook errors

### ⚠️ Warning Alerts  
- **Slow Response Times**: >2s 95th percentile
- **High Memory Usage**: >80%
- **Low Credit Balances**: Students running out of credits
- **Failed Orders**: Order processing issues

### 📈 Business Metrics
- **Daily Active Users**: Student logins
- **Order Volume**: Orders per day/hour
- **Revenue**: Successful payments
- **Restaurant Adoption**: New restaurant signups

## Troubleshooting

### Common Issues
1. **Grafana can't connect to Prometheus**
   - Check if Prometheus is running: `docker ps`
   - Verify network connectivity

2. **No metrics showing**
   - Ensure backend is exposing `/metrics` endpoint
   - Check Prometheus targets: http://localhost:9090/targets

3. **Alerts not firing**
   - Verify alert rules syntax
   - Check Prometheus rules: http://localhost:9090/rules

### Debug Commands
```bash
# Check monitoring stack status
docker-compose -f monitoring/docker-compose.monitoring.yml ps

# View logs
docker-compose -f monitoring/docker-compose.monitoring.yml logs prometheus
docker-compose -f monitoring/docker-compose.monitoring.yml logs grafana

# Restart monitoring
docker-compose -f monitoring/docker-compose.monitoring.yml restart
```

## Dashboard Setup

### 1. Import Grafana Dashboards
Pre-built dashboards for:
- Node.js Application Metrics
- Redis Performance
- System Resources
- Business KPIs

### 2. Custom Dashboards
Create dashboards for:
- Student engagement metrics
- Restaurant performance
- Payment processing
- Order fulfillment times

---
*Monitor everything, optimize everything! 📊*