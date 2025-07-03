# Environment Setup for Live Demo

## Required External Services

### 1. Database (Neon - Recommended)
1. **Go to**: [console.neon.tech](https://console.neon.tech)
2. **Sign up** with GitHub (fastest)
3. **Create project**: "bite-club-mvp"
4. **Copy connection string** (starts with `postgresql://`)
5. **Update** `backend/.env` → `DATABASE_URL`

### 2. Stripe Payment Processing
1. **Go to**: [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Create account** (free for testing)
3. **Get test keys** from Developers → API Keys:
   - Secret key (starts with `sk_test_`)
   - Publishable key (starts with `pk_test_`)
4. **Update environment variables**:
   - `backend/.env` → `STRIPE_SECRET_KEY`
   - `frontend/.env` → `REACT_APP_STRIPE_PUBLISHABLE_KEY`

### 3. Stripe Webhooks (For automatic payment processing)
1. **In Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**: `http://localhost:3001/api/credits/webhook` (for local testing)
3. **Select events**: 
   - `payment_intent.succeeded`
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
4. **Copy webhook secret** (starts with `whsec_`)
5. **Update** `backend/.env` → `STRIPE_WEBHOOK_SECRET`

### 4. Optional: Twilio (For restaurant calling system)
1. **Go to**: [console.twilio.com](https://console.twilio.com)
2. **Create account** (free trial includes credits)
3. **Get credentials** from Console Dashboard:
   - Account SID
   - Auth Token
   - Phone Number
4. **Update** `backend/.env`:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

## Quick Setup Commands

```bash
# 1. Setup database and run migrations
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run seed

# 2. Start backend
npm run dev

# 3. Start frontend (new terminal)
cd frontend
npm start
```

## Test the Application

### Default Test Accounts
- **Admin**: admin@biteclub.com / admin123
- **Student**: student@fau.edu / student123
- **Restaurant**: pizza@fau.edu / restaurant123

### Test Payment Flow
1. Login as student
2. Go to Credits page
3. Purchase credits ($10, $25, $50, or $100)
4. Use Stripe test card: `4242 4242 4242 4242`

### Test Ordering Flow
1. Browse restaurants as student
2. Add items to cart
3. Checkout (uses credits)
4. Restaurant receives order notification

## Production Deployment Notes

### Environment Variables for Production
- Set `NODE_ENV=production`
- Update `FRONTEND_URL` to your domain
- Use production Stripe keys (start with `sk_live_` and `pk_live_`)
- Set up production webhook URL

### Security Checklist
- ✅ Strong JWT secret configured
- ⚠️ Add rate limiting
- ⚠️ Configure CORS for production domain
- ⚠️ Set up SSL/HTTPS
- ⚠️ Add input validation middleware