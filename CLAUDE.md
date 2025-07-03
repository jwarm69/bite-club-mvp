# Bite Club MVP - Claude Code Configuration

## 🚀 LAUNCH MODE ACTIVE

**Status: Ready for Railway Deployment**  
**Database: Supabase with real data ✅**  
**Environment: Production-ready Docker setup ✅**  
**Next Action: Deploy to Railway with environment variables**

### Current Deployment Context
- **Supabase Database**: Connected with real restaurant/user data
- **Environment Variables**: JWT_SECRET configured, need Stripe keys
- **Railway Deployment**: Docker configuration ready for auto-deployment
- **Code Status**: Production-ready full-stack TypeScript application

### Critical Environment Variables Needed
```bash
STRIPE_SECRET_KEY="sk_live_[ACTUAL_KEY]"
STRIPE_WEBHOOK_SECRET="whsec_[WEBHOOK_SECRET]"
FRONTEND_URL="[RAILWAY_FRONTEND_URL]"
APP_URL="[RAILWAY_BACKEND_URL]"
```

**Reference: See LAUNCH.md for 30-minute deployment checklist**

---

## Project Overview
Bite Club is a smart food ordering platform for college students featuring advanced menu modifiers, restaurant-funded promotions, and an AI calling system. This is a full-stack TypeScript application with Node.js/Express backend and React frontend.

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Payments**: Stripe integration
- **Communications**: Twilio for IVR calling system
- **Email**: Nodemailer
- **Real-time**: Socket.io

### Frontend
- **Framework**: React 19 with TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Payments**: Stripe React components
- **Icons**: Lucide React
- **Testing**: React Testing Library + Jest

### Development Tools
- **Package Manager**: npm
- **Database Tools**: Prisma Studio, migrations
- **Build Tools**: TypeScript compiler, React Scripts
- **Development**: Nodemon, hot reload

## Project Structure

```
bite-club-mvp/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API endpoints (auth, orders, restaurant, etc.)
│   │   ├── services/       # Business logic (call, integration, stripe)
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Data models
│   │   └── utils/          # Helpers, seed data
│   ├── prisma/             # Database schema and migrations
│   └── scripts/            # Migration and utility scripts
└── frontend/               # React TypeScript app
    ├── src/
    │   ├── components/     # UI components
    │   ├── contexts/       # React contexts (Auth, Cart, Order)
    │   ├── services/       # API integration
    │   ├── types/          # TypeScript definitions
    │   └── utils/          # Frontend utilities
    └── public/             # Static assets
```

## Development Commands

### Backend Commands
```bash
cd backend
npm run dev         # Start development server (nodemon)
npm run build       # Build TypeScript to JavaScript
npm run start       # Start production server
npm run seed        # Populate database with sample data
```

### Frontend Commands
```bash
cd frontend
npm start           # Start development server (port 3000)
npm run build       # Build for production
npm test            # Run tests with React Testing Library
```

### Database Commands
```bash
# From backend directory
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run database migrations
npx prisma studio       # Open database GUI
npx prisma migrate reset # Reset database and reseed
```

## Domain Knowledge

### Core Business Logic
- **Multi-role System**: Students, Restaurants, Admins with different permissions
- **Credit System**: Students purchase credits via Stripe for orders
- **School/Organization Management**: Multi-tenant architecture
- **Restaurant Approval Process**: Admin approval required for new restaurants

### Advanced Features
- **Menu Modifiers**: Complex nested modifier system for customization
- **Restaurant Promotions**: Restaurant-funded promotional campaigns
- **IVR Calling System**: Automated order calling with Twilio
- **POS Integration**: Multi-POS system support (Toast POS ready)

### Key Workflows
1. **Student Registration**: Email verification, school association
2. **Restaurant Onboarding**: Application, admin approval, menu setup
3. **Order Process**: Cart → Payment → Restaurant notification → Calling system
4. **Call Management**: IVR flow, acceptance/rejection, analytics

## Coding Standards

### Backend Patterns
- **Route Structure**: RESTful APIs with Express Router
- **Error Handling**: Consistent error responses with proper HTTP codes
- **Authentication**: JWT middleware on protected routes
- **Database**: Prisma models with proper relations
- **Validation**: Input validation on all endpoints
- **Security**: Helmet, CORS, bcrypt for passwords

### Frontend Patterns
- **Components**: Functional components with TypeScript
- **State Management**: Context API for global state
- **API Calls**: Centralized in services/api.ts
- **Routing**: Protected routes based on user roles
- **Styling**: Tailwind CSS with consistent design system
- **Error Handling**: User-friendly error messages

### File Naming Conventions
- **Backend**: kebab-case for files, PascalCase for types
- **Frontend**: PascalCase for components, camelCase for utilities
- **Database**: snake_case for table/column names

## Environment Configuration

### Required Environment Variables
```bash
# Backend (.env)
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
STRIPE_SECRET_KEY="sk_test_..."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
EMAIL_USER="..."
EMAIL_PASS="..."

# Frontend (.env)
REACT_APP_API_URL="http://localhost:3001/api"
REACT_APP_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## Testing Philosophy
- **Backend**: Integration tests for API endpoints (to be implemented)
- **Frontend**: Component testing with React Testing Library
- **Database**: Test database for safe testing
- **Manual Testing**: Comprehensive test credentials provided

## Test Credentials
- **Admin**: admin@biteclub.com / admin123
- **Student**: student@fau.edu / student123
- **Restaurant**: pizza@fau.edu / restaurant123

## Development Notes

### Common Tasks
- Always run `npm run seed` after database changes
- Use Prisma Studio for database inspection
- Frontend proxy configured for API calls
- Hot reload enabled for both frontend and backend

### Integration Points
- Stripe webhooks for payment processing
- Twilio webhooks for call status updates
- Toast POS API integration (planned)
- Email notifications for key events

### Performance Considerations
- Database indexing on frequently queried fields
- Efficient menu modifier queries
- Optimized API response structures
- Frontend component memoization where needed

## Security Standards
- JWT tokens with appropriate expiration
- Password hashing with bcrypt
- Input sanitization and validation
- CORS configuration for production
- Environment variable protection
- SQL injection prevention via Prisma

This configuration enables Claude Code to understand the full context of the Bite Club MVP project and provide intelligent assistance with development tasks.