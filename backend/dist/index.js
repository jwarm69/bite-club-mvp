"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.prisma = void 0;
exports.getPrisma = getPrisma;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
// Lazy Prisma initialization - start server first, connect DB later
let realPrisma = null;
async function getPrisma() {
    if (!realPrisma) {
        try {
            console.log('🔄 Initializing Prisma connection...');
            realPrisma = new client_1.PrismaClient({
                log: ['error', 'warn'],
            });
            await realPrisma.$connect();
            // Update the exported prisma variable for backward compatibility
            Object.assign(exports.prisma, realPrisma);
            console.log('✅ Database connected successfully!');
        }
        catch (error) {
            console.error('❌ Database connection failed:', error.message);
            throw error;
        }
    }
    return realPrisma;
}
// Mock Prisma client for compilation and initial startup
// Gets replaced with real client when getPrisma() is first called
exports.prisma = {
    user: { findMany: () => Promise.reject(new Error('Database not initialized')) },
    restaurant: { findMany: () => Promise.reject(new Error('Database not initialized')) },
    school: { findMany: () => Promise.reject(new Error('Database not initialized')) },
};
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const credits_1 = __importDefault(require("./routes/credits"));
const admin_1 = __importDefault(require("./routes/admin"));
const restaurant_1 = __importDefault(require("./routes/restaurant"));
const orders_1 = __importDefault(require("./routes/orders"));
const calls_1 = __importDefault(require("./routes/calls"));
const integrations_1 = __importDefault(require("./routes/integrations"));
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
    }
    catch (error) {
        res.status(500).json({
            status: 'Database connection failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
app.use('/api/auth', auth_1.default);
app.use('/api/credits', credits_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/restaurant', restaurant_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/calls', calls_1.default);
app.use('/api/integrations', integrations_1.default);
// Debug route to check public directory
app.get('/debug-public', (req, res) => {
    const fs = require('fs');
    const publicPath = path_1.default.join(__dirname, '../public');
    try {
        const files = fs.readdirSync(publicPath);
        res.json({
            publicPath,
            files,
            indexExists: fs.existsSync(path_1.default.join(publicPath, 'index.html'))
        });
    }
    catch (error) {
        res.json({ error: error instanceof Error ? error.message : 'Unknown error', publicPath });
    }
});
// Serve React static files
const publicPath = process.env.NODE_ENV === 'production'
    ? path_1.default.join(__dirname, '../public')
    : path_1.default.join(__dirname, '../public');
app.use(express_1.default.static(publicPath));
// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
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
    await exports.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down gracefully...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=index.js.map