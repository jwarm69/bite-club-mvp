import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Lazy Prisma initialization - start server first, connect DB later
let prisma: PrismaClient | null = null;

export async function getPrisma(): Promise<PrismaClient> {
  if (!prisma) {
    try {
      console.log('🔄 Initializing Prisma connection...');
      prisma = new PrismaClient({
        log: ['error', 'warn'],
      });
      await prisma.$connect();
      console.log('✅ Database connected successfully!');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }
  return prisma;
}

// Legacy export for compatibility (will be removed)
export const prismaLegacy = null;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
import authRoutes from './routes/auth';
import creditsRoutes from './routes/credits';
import adminRoutes from './routes/admin';
import restaurantRoutes from './routes/restaurant';
import ordersRoutes from './routes/orders';
import callsRoutes from './routes/calls';
import integrationsRoutes from './routes/integrations';

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database connection test endpoint
app.get('/test-db', async (req, res) => {
  try {
    const db = await getPrisma();
    const userCount = await db.user.count();
    const restaurantCount = await db.restaurant.count();
    res.json({ 
      status: 'Database connected!', 
      users: userCount,
      restaurants: restaurantCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Database connection failed', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/integrations', integrationsRoutes);

// Debug route to check public directory
app.get('/debug-public', (req, res) => {
  const fs = require('fs');
  const publicPath = path.join(__dirname, '../public');
  try {
    const files = fs.readdirSync(publicPath);
    res.json({ 
      publicPath, 
      files,
      indexExists: fs.existsSync(path.join(publicPath, 'index.html'))
    });
  } catch (error) {
    res.json({ error: error instanceof Error ? error.message : 'Unknown error', publicPath });
  }
});

// Serve React static files
const publicPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../public') 
  : path.join(__dirname, '../public');
  
app.use(express.static(publicPath));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in other modules
export { io };

// Simple test route
app.get('/test', (req, res) => {
  res.send('Test route works!');
});

// Handle React routing - catch all handler: send back React's index.html file
app.get('*', (req, res) => {
  res.send('Catch-all route hit for: ' + req.path);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});