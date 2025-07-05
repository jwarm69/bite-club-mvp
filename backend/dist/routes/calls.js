"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const call_1 = require("../services/call");
const index_1 = require("../index");
const router = express_1.default.Router();
// Webhook endpoint for Twilio TwiML responses
router.get('/twiml/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('[CALLS] TwiML requested for order:', orderId);
        const twiml = await call_1.callService.getOrderTwiML(orderId);
        res.set('Content-Type', 'text/xml');
        res.status(200).send(twiml);
    }
    catch (error) {
        console.error('[CALLS] Error generating TwiML:', error);
        res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error. Goodbye.</Say>
  <Hangup/>
</Response>`);
    }
});
// Webhook endpoint for IVR responses
router.post('/handle-response/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { Digits } = req.body;
        console.log('[CALLS] IVR response for order:', orderId, 'digits:', Digits);
        const twiml = await call_1.callService.handleIVRResponse(orderId, Digits);
        res.set('Content-Type', 'text/xml');
        res.status(200).send(twiml);
    }
    catch (error) {
        console.error('[CALLS] Error handling IVR response:', error);
        res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error. Goodbye.</Say>
  <Hangup/>
</Response>`);
    }
});
// Webhook endpoint for call status updates
router.post('/status-callback', async (req, res) => {
    try {
        const { CallSid, CallStatus, CallDuration } = req.body;
        console.log('[CALLS] Status callback:', CallSid, CallStatus);
        await call_1.callService.handleStatusCallback(CallSid, CallStatus, CallDuration);
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('[CALLS] Error handling status callback:', error);
        res.status(500).send('Error');
    }
});
// Get restaurant call settings (Restaurant only)
router.get('/settings', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.RESTAURANT), async (req, res) => {
    try {
        const userId = req.user.userId;
        const restaurant = await (await (0, index_1.getPrisma)()).restaurant.findFirst({
            where: { userId },
            select: {
                id: true,
                name: true,
                phone: true,
                callEnabled: true,
                callPhone: true,
                callRetries: true,
                callTimeoutSeconds: true
            }
        });
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        res.json({ restaurant });
    }
    catch (error) {
        console.error('[CALLS] Error getting call settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update restaurant call settings (Restaurant only)
router.put('/settings', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.RESTAURANT), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { callEnabled, callPhone, callRetries, callTimeoutSeconds } = req.body;
        // Validate inputs
        if (typeof callEnabled !== 'boolean') {
            res.status(400).json({ error: 'callEnabled must be a boolean' });
            return;
        }
        if (callRetries !== undefined && (callRetries < 0 || callRetries > 5)) {
            res.status(400).json({ error: 'callRetries must be between 0 and 5' });
            return;
        }
        if (callTimeoutSeconds !== undefined && (callTimeoutSeconds < 15 || callTimeoutSeconds > 120)) {
            res.status(400).json({ error: 'callTimeoutSeconds must be between 15 and 120' });
            return;
        }
        const restaurant = await (await (0, index_1.getPrisma)()).restaurant.findFirst({
            where: { userId }
        });
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        const updatedRestaurant = await (await (0, index_1.getPrisma)()).restaurant.update({
            where: { id: restaurant.id },
            data: {
                callEnabled,
                callPhone: callPhone || null,
                callRetries: callRetries ?? restaurant.callRetries,
                callTimeoutSeconds: callTimeoutSeconds ?? restaurant.callTimeoutSeconds
            },
            select: {
                id: true,
                name: true,
                phone: true,
                callEnabled: true,
                callPhone: true,
                callRetries: true,
                callTimeoutSeconds: true
            }
        });
        res.json({ restaurant: updatedRestaurant });
    }
    catch (error) {
        console.error('[CALLS] Error updating call settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get call history for restaurant (Restaurant only)
router.get('/history', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.RESTAURANT), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 50, offset = 0 } = req.query;
        const restaurant = await (await (0, index_1.getPrisma)()).restaurant.findFirst({
            where: { userId }
        });
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        const callLogs = await (await (0, index_1.getPrisma)()).callLog.findMany({
            where: { restaurantId: restaurant.id },
            include: {
                order: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { callTime: 'desc' },
            take: Number(limit),
            skip: Number(offset)
        });
        const totalCalls = await (await (0, index_1.getPrisma)()).callLog.count({
            where: { restaurantId: restaurant.id }
        });
        const stats = await (await (0, index_1.getPrisma)()).callLog.aggregate({
            where: { restaurantId: restaurant.id },
            _sum: { cost: true },
            _count: { id: true }
        });
        res.json({
            callLogs,
            pagination: {
                total: totalCalls,
                limit: Number(limit),
                offset: Number(offset)
            },
            stats: {
                totalCalls: stats._count.id,
                totalCost: Number(stats._sum.cost || 0)
            }
        });
    }
    catch (error) {
        console.error('[CALLS] Error getting call history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Retry failed call (Restaurant only)
router.post('/retry/:orderId', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.RESTAURANT), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { orderId } = req.params;
        // Verify restaurant owns this order
        const restaurant = await (await (0, index_1.getPrisma)()).restaurant.findFirst({
            where: { userId }
        });
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        const order = await (await (0, index_1.getPrisma)()).order.findFirst({
            where: {
                id: orderId,
                restaurantId: restaurant.id
            }
        });
        if (!order) {
            res.status(404).json({ error: 'Order not found or access denied' });
            return;
        }
        const result = await call_1.callService.retryFailedCall(orderId);
        if (result.success) {
            res.json({ success: true, message: 'Call retry initiated' });
        }
        else {
            res.status(400).json({ error: result.error });
        }
    }
    catch (error) {
        console.error('[CALLS] Error retrying call:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Admin endpoints for call management
// Get all restaurant call settings (Admin only)
router.get('/admin/restaurants', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const restaurants = await (await (0, index_1.getPrisma)()).restaurant.findMany({
            select: {
                id: true,
                name: true,
                phone: true,
                callEnabled: true,
                callPhone: true,
                callRetries: true,
                callTimeoutSeconds: true,
                school: {
                    select: {
                        name: true,
                        domain: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json({ restaurants });
    }
    catch (error) {
        console.error('[CALLS] Error getting restaurant call settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update restaurant call settings (Admin only)
router.put('/admin/restaurants/:restaurantId', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { callEnabled, callPhone, callRetries, callTimeoutSeconds } = req.body;
        const updatedRestaurant = await (await (0, index_1.getPrisma)()).restaurant.update({
            where: { id: restaurantId },
            data: {
                callEnabled,
                callPhone: callPhone || null,
                callRetries: callRetries ?? undefined,
                callTimeoutSeconds: callTimeoutSeconds ?? undefined
            },
            select: {
                id: true,
                name: true,
                phone: true,
                callEnabled: true,
                callPhone: true,
                callRetries: true,
                callTimeoutSeconds: true
            }
        });
        res.json({ restaurant: updatedRestaurant });
    }
    catch (error) {
        console.error('[CALLS] Error updating restaurant call settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get platform call analytics (Admin only)
router.get('/admin/analytics', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = startDate && endDate ? {
            callTime: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        } : {};
        const stats = await (await (0, index_1.getPrisma)()).callLog.aggregate({
            where: dateFilter,
            _sum: { cost: true, duration: true },
            _count: { id: true }
        });
        const responseStats = await (await (0, index_1.getPrisma)()).callLog.groupBy({
            by: ['responseType'],
            where: dateFilter,
            _count: { id: true }
        });
        const restaurantStats = await (await (0, index_1.getPrisma)()).callLog.groupBy({
            by: ['restaurantId'],
            where: dateFilter,
            _count: { id: true },
            _sum: { cost: true }
        });
        res.json({
            overall: {
                totalCalls: stats._count.id,
                totalCost: Number(stats._sum.cost || 0),
                totalDuration: stats._sum.duration || 0
            },
            responseTypes: responseStats.map(stat => ({
                type: stat.responseType,
                count: stat._count.id
            })),
            restaurantBreakdown: restaurantStats.map(stat => ({
                restaurantId: stat.restaurantId,
                callCount: stat._count.id,
                totalCost: Number(stat._sum.cost || 0)
            }))
        });
    }
    catch (error) {
        console.error('[CALLS] Error getting call analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=calls.js.map