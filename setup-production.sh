#!/bin/bash

# Bite Club MVP Production Setup Script
set -e

echo "🚀 Setting up Bite Club MVP for Production Demo"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${YELLOW}Step 1: Database Setup${NC}"
echo "Please complete the following:"
echo "1. Go to https://console.neon.tech"
echo "2. Create account and new project 'bite-club-mvp'"
echo "3. Copy your connection string"
echo "4. Update DATABASE_URL in backend/.env"
echo ""
read -p "Press Enter when database is set up..."

echo ""
echo -e "${YELLOW}Step 2: Stripe Setup${NC}"
echo "Please complete the following:"
echo "1. Go to https://dashboard.stripe.com"
echo "2. Get your test API keys from Developers > API Keys"
echo "3. Update STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY in backend/.env"
echo "4. Create webhook endpoint for: /api/credits/webhook"
echo "5. Update STRIPE_WEBHOOK_SECRET in backend/.env"
echo ""
read -p "Press Enter when Stripe is set up..."

echo ""
echo -e "${YELLOW}Step 3: Running Database Migrations${NC}"
cd backend
echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate dev --name init

echo "Seeding database with initial data..."
npm run seed

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Terminal 1: cd backend && npm run dev"
echo "2. Terminal 2: cd frontend && npm start"
echo "3. Open http://localhost:3000"
echo ""
echo "Test accounts:"
echo "- Admin: admin@biteclub.com / admin123"
echo "- Student: student@fau.edu / student123"
echo "- Restaurant: pizza@fau.edu / restaurant123"