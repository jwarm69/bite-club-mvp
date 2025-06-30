# 🚀 Quick Development Guide

## Preview the App (Fastest Method)

### Option 1: Use a Cloud Database (Recommended)
1. **Get a free PostgreSQL database:**
   - Go to [Supabase](https://supabase.com) or [Neon](https://neon.tech)
   - Create a free account and new project
   - Copy the connection string

2. **Run the setup:**
   ```bash
   ./setup.sh
   ```

3. **Update database URL:**
   ```bash
   # Edit backend/.env
   DATABASE_URL="postgresql://your-db-connection-string"
   ```

4. **Set up database and start servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npx prisma migrate dev --name init
   npm run seed
   npm run dev

   # Terminal 2 - Frontend  
   cd frontend
   npm start
   ```

### Option 2: Local PostgreSQL
If you have PostgreSQL installed locally:

1. Create database:
   ```bash
   createdb biteclub_db
   ```

2. Update `.env`:
   ```bash
   DATABASE_URL="postgresql://your-username:your-password@localhost:5432/biteclub_db"
   ```

3. Follow steps 4 from Option 1

## 🎯 What You'll See

### Login Page (`http://localhost:3000/auth`)
- Switch between Login, Student Signup, Restaurant Signup
- No college email verification required anymore
- Clean, modern UI with Tailwind CSS

### Student Dashboard
- Credit balance display
- Three main sections: Browse, Order, Rewards
- Ready for menu integration

### Restaurant Dashboard  
- Order management preview
- Menu management section
- Promotion tools

### Admin Dashboard
- School management
- Restaurant approval system
- Platform analytics

## 🔧 Development Commands

```bash
# Backend (Terminal 1)
cd backend
npm run dev          # Start development server
npm run seed         # Add sample data
npx prisma studio    # View database in browser

# Frontend (Terminal 2)  
cd frontend
npm start            # Start React app
npm run build        # Build for production
```

## 🔑 Test the Authentication

After seeding, test with these accounts:

1. **Student Account:**
   - Email: `student@fau.edu`
   - Password: `student123`
   - Features: Credit balance, ordering interface

2. **Restaurant Account:**
   - Email: `pizza@fau.edu` 
   - Password: `restaurant123`
   - Features: Restaurant management dashboard

3. **Admin Account:**
   - Email: `admin@biteclub.com`
   - Password: `admin123`
   - Features: Platform administration

## 📱 What's Working Now

✅ **Multi-role authentication**
✅ **School selection (no email verification)**
✅ **Credit system foundation**
✅ **Database with sample data**
✅ **Role-based dashboards**
✅ **Responsive design**

## 🔒 Security First

⚠️ **IMPORTANT**: Before continuing development, address critical security vulnerabilities.

📋 **Security Roadmap**: See [SECURITY-ROADMAP.md](./SECURITY-ROADMAP.md) for:
- 20+ identified vulnerabilities (5 critical, 5 high priority)
- 3-week implementation plan
- Testing & verification procedures

**Critical fixes needed immediately:**
1. Replace weak JWT secret
2. Add input validation  
3. Implement rate limiting
4. Fix authorization checks
5. Strengthen password policy

## 🚧 Next Development Steps

1. **Security Hardening** - Complete critical fixes from security roadmap
2. **Menu System** - Display restaurants and menu items
3. **Shopping Cart** - Add items with modifiers
4. **Checkout** - Process orders with credits
5. **Promotions** - First-time discounts and loyalty
6. **AI Calling** - Automated restaurant communication

## 🐛 Troubleshooting

**Database connection issues:**
- Make sure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Try: `npx prisma db push` to sync schema

**Port conflicts:**
- Backend: Change PORT in `backend/.env`
- Frontend: Use `npm start` and choose different port when prompted

**Missing dependencies:**
```bash
# Backend
cd backend && npm install

# Frontend  
cd frontend && npm install
```