# 🚀 Quick Start Guide

## Step 1: Get Your Database Password

1. Go to your **Supabase dashboard**
2. Click **"Settings"** (gear icon) in left sidebar  
3. Click **"Database"**
4. Scroll to **"Connection string"** section
5. Copy the full connection string (it will have your real password)

## Step 2: Update Database Connection

Replace `[YOUR-PASSWORD]` in `backend/.env` with your actual connection string:

```bash
# Edit backend/.env
DATABASE_URL="postgresql://postgres:your_real_password@db.emkzjglkxshkhtcohngc.supabase.co:5432/postgres"
```

## Step 3: Set Up Database

```bash
cd backend
npx prisma migrate dev --name init
npm run seed
```

## Step 4: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend  
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## Step 5: Test the App

Visit: **http://localhost:3000**

**Test Accounts:**
- **Student:** `student@fau.edu` / `student123`
- **Restaurant:** `pizza@fau.edu` / `restaurant123`  
- **Admin:** `admin@biteclub.com` / `admin123`

## 🎯 What You'll See

✅ **Login/Signup page** with school selection
✅ **Student dashboard** with credit balance  
✅ **Restaurant dashboard** for menu management
✅ **Admin dashboard** for platform management
✅ **Role-based authentication** working
✅ **Database** with sample restaurants and menu items

Your Bite Club MVP is ready to preview! 🍕