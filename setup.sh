#!/bin/bash

echo "🍕 Setting up Bite Club MVP..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if PostgreSQL is running (optional - can use remote DB)
echo "📊 Note: Make sure you have a PostgreSQL database available"
echo "You can use a local PostgreSQL installation or a cloud service like:"
echo "- Supabase (free tier): https://supabase.com"
echo "- Neon (free tier): https://neon.tech"
echo "- Railway (free tier): https://railway.app"
echo ""

# Backend setup
echo "🔧 Setting up backend..."
cd backend

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your database URL and API keys"
else
    echo "✅ .env file already exists"
fi

cd ..

# Frontend setup
echo "🎨 Setting up frontend..."
cd frontend

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating frontend .env file..."
    cat > .env << EOL
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
EOL
    echo "⚠️  Please update the frontend .env file with your Stripe publishable key"
else
    echo "✅ Frontend .env file already exists"
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your database URL and API keys"
echo "2. Update frontend/.env with your Stripe publishable key"
echo "3. Run database migrations: cd backend && npx prisma migrate dev"
echo "4. Seed the database: cd backend && npm run seed"
echo "5. Start backend: cd backend && npm run dev"
echo "6. Start frontend: cd frontend && npm start"
echo ""
echo "🔗 Your app will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🔑 Test credentials (after seeding):"
echo "   Admin:      admin@biteclub.com / admin123"
echo "   Student:    student@fau.edu / student123"
echo "   Restaurant: pizza@fau.edu / restaurant123"