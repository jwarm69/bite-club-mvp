"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get all restaurants for admin
router.get('/restaurants', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const restaurants = await index_1.prisma.restaurant.findMany({
            include: {
                school: true,
                orders: {
                    where: {
                        status: 'COMPLETED'
                    },
                    select: {
                        finalAmount: true
                    }
                }
            }
        });
        const formattedRestaurants = restaurants.map(restaurant => ({
            id: restaurant.id,
            name: restaurant.name,
            description: restaurant.description,
            status: restaurant.active ? 'active' : 'inactive',
            school: restaurant.school.name,
            schoolId: restaurant.schoolId,
            email: restaurant.email || 'No email',
            ownerName: 'Restaurant Owner',
            revenue: restaurant.orders.reduce((sum, order) => sum + Number(order.finalAmount), 0),
            totalOrders: restaurant.orders.length
        }));
        res.json(formattedRestaurants);
    }
    catch (error) {
        console.error('Get restaurants error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all students for admin
router.get('/students', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const students = await index_1.prisma.user.findMany({
            where: {
                role: client_1.UserRole.STUDENT
            },
            include: {
                school: true,
                orders: {
                    where: {
                        status: 'COMPLETED'
                    }
                },
                creditTransactions: true
            }
        });
        const formattedStudents = students.map(student => ({
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            email: student.email,
            school: student.school?.name || 'No School',
            creditBalance: student.creditBalance,
            totalOrders: student.orders.length,
            totalSpent: student.orders.reduce((sum, order) => sum + Number(order.finalAmount), 0),
            joinedAt: student.createdAt
        }));
        res.json(formattedStudents);
    }
    catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get revenue analytics
router.get('/analytics/revenue', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { period = 'today' } = req.query;
        let startDate;
        const endDate = new Date();
        switch (period) {
            case 'today':
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            default:
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
        }
        // Get completed orders within the period
        const orders = await index_1.prisma.order.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        school: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        school: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        // Calculate total revenue
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.finalAmount), 0);
        // Revenue by restaurant
        const revenueByRestaurant = {};
        orders.forEach(order => {
            const restaurantId = order.restaurant.id;
            const restaurantName = order.restaurant.name;
            if (!revenueByRestaurant[restaurantId]) {
                revenueByRestaurant[restaurantId] = {
                    name: restaurantName,
                    revenue: 0,
                    orders: 0
                };
            }
            revenueByRestaurant[restaurantId].revenue += Number(order.finalAmount);
            revenueByRestaurant[restaurantId].orders += 1;
        });
        // Revenue by school
        const revenueBySchool = {};
        orders.forEach(order => {
            const schoolId = order.user.school?.id;
            const schoolName = order.user.school?.name || 'Unknown School';
            if (schoolId) {
                if (!revenueBySchool[schoolId]) {
                    revenueBySchool[schoolId] = {
                        name: schoolName,
                        revenue: 0,
                        students: new Set()
                    };
                }
                revenueBySchool[schoolId].revenue += Number(order.finalAmount);
                revenueBySchool[schoolId].students.add(order.userId);
            }
        });
        // Format the response
        const analytics = {
            period,
            totalRevenue,
            totalOrders: orders.length,
            byRestaurant: Object.values(revenueByRestaurant).sort((a, b) => b.revenue - a.revenue),
            bySchool: Object.entries(revenueBySchool).map(([schoolId, data]) => ({
                id: schoolId,
                name: data.name,
                revenue: data.revenue,
                uniqueStudents: data.students.size
            })).sort((a, b) => b.revenue - a.revenue)
        };
        res.json(analytics);
    }
    catch (error) {
        console.error('Get revenue analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Approve/disapprove restaurant
router.patch('/restaurants/:id/status', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;
        const restaurant = await index_1.prisma.restaurant.update({
            where: { id },
            data: { active }
        });
        res.json({
            id: restaurant.id,
            name: restaurant.name,
            status: restaurant.active ? 'active' : 'inactive',
            ownerEmail: restaurant.email || 'No email'
        });
    }
    catch (error) {
        console.error('Update restaurant status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Add credits to student account (admin only)
router.post('/students/:id/credits', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({ error: 'Valid amount is required' });
            return;
        }
        // Update user balance and create transaction
        const result = await index_1.prisma.$transaction(async (tx) => {
            // Update user balance
            const user = await tx.user.update({
                where: { id },
                data: {
                    creditBalance: {
                        increment: amount
                    }
                }
            });
            // Create transaction record
            await tx.creditTransaction.create({
                data: {
                    userId: id,
                    amount,
                    type: 'ADMIN_ADD',
                    description: reason || `Admin credit addition: $${amount}`
                }
            });
            return user;
        });
        res.json({
            success: true,
            newBalance: result.creditBalance,
            addedAmount: amount
        });
    }
    catch (error) {
        console.error('Add credits error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Process refund for order (admin only)
router.post('/orders/:id/refund', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const order = await index_1.prisma.order.findUnique({
            where: { id },
            include: {
                user: true
            }
        });
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        if (order.status === 'REFUNDED') {
            res.status(400).json({ error: 'Order already refunded' });
            return;
        }
        // Process refund
        const result = await index_1.prisma.$transaction(async (tx) => {
            // Update order status
            const updatedOrder = await tx.order.update({
                where: { id },
                data: {
                    status: 'REFUNDED',
                    refundReason: reason
                }
            });
            // Add credits back to user
            await tx.user.update({
                where: { id: order.userId },
                data: {
                    creditBalance: {
                        increment: Number(order.finalAmount)
                    }
                }
            });
            // Create refund transaction
            await tx.creditTransaction.create({
                data: {
                    userId: order.userId,
                    amount: Number(order.finalAmount),
                    type: 'REFUND',
                    description: `Refund for order #${order.id}: ${reason || 'Admin refund'}`,
                    orderId: order.id
                }
            });
            return updatedOrder;
        });
        res.json({
            success: true,
            orderId: result.id,
            refundAmount: Number(order.finalAmount),
            newStatus: result.status
        });
    }
    catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update restaurant hours (admin only)
router.put('/restaurants/:id/hours', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { operatingHours } = req.body;
        if (!operatingHours) {
            res.status(400).json({ error: 'Operating hours are required' });
            return;
        }
        // Validate hours format
        const validatedHours = validateOperatingHours(operatingHours);
        if (!validatedHours) {
            res.status(400).json({ error: 'Invalid operating hours format' });
            return;
        }
        const restaurant = await index_1.prisma.restaurant.update({
            where: { id },
            data: { operatingHours: validatedHours },
            select: {
                id: true,
                name: true,
                operatingHours: true,
                active: true
            }
        });
        res.json({
            success: true,
            restaurant
        });
    }
    catch (error) {
        console.error('Update restaurant hours error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get restaurant hours (admin only)
router.get('/restaurants/:id/hours', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await index_1.prisma.restaurant.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                operatingHours: true,
                active: true
            }
        });
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        res.json({
            restaurantId: restaurant.id,
            name: restaurant.name,
            operatingHours: restaurant.operatingHours || getDefaultHours(),
            active: restaurant.active
        });
    }
    catch (error) {
        console.error('Get restaurant hours error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Helper functions for admin route
function getDefaultHours() {
    return {
        monday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        saturday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
        sunday: { isOpen: true, openTime: '10:00', closeTime: '20:00' }
    };
}
function validateOperatingHours(hours) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const validatedHours = {};
    for (const day of days) {
        if (!hours[day])
            return null;
        const dayHours = hours[day];
        if (typeof dayHours.isOpen !== 'boolean')
            return null;
        if (dayHours.isOpen) {
            if (!dayHours.openTime || !dayHours.closeTime)
                return null;
            if (!isValidTimeFormat(dayHours.openTime) || !isValidTimeFormat(dayHours.closeTime))
                return null;
        }
        validatedHours[day] = {
            isOpen: dayHours.isOpen,
            openTime: dayHours.isOpen ? dayHours.openTime : null,
            closeTime: dayHours.isOpen ? dayHours.closeTime : null
        };
    }
    return validatedHours;
}
function isValidTimeFormat(time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
}
exports.default = router;
//# sourceMappingURL=admin.js.map