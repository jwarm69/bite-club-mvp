# 🍕 Bite Club MVP

**Status: 🚀 READY TO LAUNCH**  
**Database: ✅ Supabase with real data**  
**Code: ✅ Production-ready**  
**Next: Get Stripe keys → Deploy to Railway**

A smart food ordering platform for college students with advanced modifiers, restaurant-funded promotions, and AI calling system.

## ⚡ LAUNCH NOW (30 minutes)

**See [LAUNCH.md](./LAUNCH.md) for complete 30-minute deployment checklist**

### Critical Next Steps:
1. **Get Stripe API keys** from Stripe Dashboard
2. **Deploy to Railway** with environment variables  
3. **Test live application**

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Stripe account (for payments)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database credentials and API keys:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/biteclub_db"
   JWT_SECRET="your-jwt-secret"
   STRIPE_SECRET_KEY="sk_test_your_stripe_key"
   # ... other variables
   ```

4. **Set up database:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   npm run seed
   ```

5. **Start backend server:**
   ```bash
   npm run dev
   ```
   Backend will run on http://localhost:3001

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env file with:
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
   ```

4. **Start frontend:**
   ```bash
   npm start
   ```
   Frontend will run on http://localhost:3000

## 🔑 Test Credentials

After seeding, you can use these accounts:

- **Admin:** admin@biteclub.com / admin123
- **Student:** student@fau.edu / student123  
- **Restaurant:** pizza@fau.edu / restaurant123

## 🏗️ Project Structure

```
bite-club-mvp/
├── backend/          # Node.js API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   ├── middleware/ # Auth, validation
│   │   └── utils/    # Helpers, seed data
│   └── prisma/       # Database schema
└── frontend/         # React TypeScript app
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── contexts/   # React contexts
    │   ├── services/   # API calls
    │   └── types/      # TypeScript definitions
    └── public/
```

## 🎯 Features Implemented

### ✅ Core MVP
- Multi-role authentication (Student/Restaurant/Admin)
- Credit purchase system with Stripe
- School/organization management
- Restaurant registration and approval

### ✅ Database Schema
- Complete relational database with Prisma ORM
- Support for complex menu modifiers
- Restaurant promotion tracking
- Order management with call logs
- Toast POS integration ready fields
- Multi-POS integration architecture

### ✅ IVR Calling System
- Twilio-based IVR calling for order acceptance/rejection
- Restaurant-specific call settings and phone numbers
- Admin dashboard for call management and analytics
- Cost tracking and success rate monitoring
- Automatic order calling integration

### ✅ Integration Architecture
- Comprehensive POS integration service foundation
- Toast POS integration roadmap and documentation
- Multi-POS system support architecture
- Configuration management and validation

### 🚧 In Progress
- Advanced menu system with nested modifiers
- Restaurant-funded promotion system
- Shopping cart with modifier calculations
- Real-time order tracking
- Toast POS API implementation

## 🔧 Development Commands

### Backend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run seed     # Populate database with sample data
```

### Frontend
```bash
npm start        # Start development server
npm run build    # Build for production
npm test         # Run tests
```

## 📊 Database Management

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# View database in browser
npx prisma studio

# Reset database and reseed
npx prisma migrate reset
npm run seed
```