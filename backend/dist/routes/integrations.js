"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const integration_1 = require("../services/integration");
const index_1 = require("../index");
const router = express_1.default.Router();
// Helper function to get restaurant ID
async function getRestaurantId(req) {
    if (req.user?.role === client_1.UserRole.ADMIN) {
        return req.body.restaurantId || req.query.restaurantId || null;
    }
    else {
        // Find restaurant owned by this user
        const restaurant = await index_1.prisma.restaurant.findFirst({
            where: { userId: req.user.userId },
            select: { id: true }
        });
        return restaurant?.id || null;
    }
}
// Get restaurant integration status
router.get('/status', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const restaurantId = await getRestaurantId(req);
        if (!restaurantId) {
            res.status(400).json({ error: 'Restaurant ID required or restaurant not found' });
            return;
        }
        const status = await integration_1.integrationManager.getIntegrationStatus(restaurantId);
        res.json(status);
    }
    catch (error) {
        console.error('Get integration status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Enable integration
router.post('/enable', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { type, config } = req.body;
        const restaurantId = await getRestaurantId(req);
        if (!restaurantId) {
            res.status(400).json({ error: 'Restaurant ID required or restaurant not found' });
            return;
        }
        if (!type || !config) {
            res.status(400).json({ error: 'Integration type and config are required' });
            return;
        }
        const result = await integration_1.integrationManager.enableIntegration(restaurantId, type, config);
        if (result.success) {
            res.json({ success: true, message: `${type} integration enabled successfully` });
        }
        else {
            res.status(400).json({ error: result.error });
        }
    }
    catch (error) {
        console.error('Enable integration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Disable integration
router.post('/disable', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { type } = req.body;
        const restaurantId = await getRestaurantId(req);
        if (!restaurantId) {
            res.status(400).json({ error: 'Restaurant ID required or restaurant not found' });
            return;
        }
        if (!type) {
            res.status(400).json({ error: 'Integration type required' });
            return;
        }
        const result = await integration_1.integrationManager.disableIntegration(restaurantId, type);
        if (result.success) {
            res.json({ success: true, message: `${type} integration disabled successfully` });
        }
        else {
            res.status(500).json({ error: 'Failed to disable integration' });
        }
    }
    catch (error) {
        console.error('Disable integration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Test integration configuration
router.post('/test', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { type, config } = req.body;
        if (!type || !config) {
            res.status(400).json({ error: 'Integration type and config are required' });
            return;
        }
        const isValid = await integration_1.integrationManager.validateIntegrationConfig(type, config);
        res.json({
            valid: isValid,
            message: isValid ? 'Configuration is valid' : 'Configuration is invalid'
        });
    }
    catch (error) {
        console.error('Test integration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Sync menu with integrations
router.post('/sync/menu', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { integrationType } = req.body;
        const restaurantId = await getRestaurantId(req);
        if (!restaurantId) {
            res.status(400).json({ error: 'Restaurant ID required or restaurant not found' });
            return;
        }
        const result = await integration_1.integrationManager.syncRestaurantMenu(restaurantId, integrationType);
        res.json({
            success: result.success,
            results: result.results,
            message: result.success ? 'Menu sync completed' : 'Menu sync failed'
        });
    }
    catch (error) {
        console.error('Sync menu error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Sync specific order with integrations
router.post('/sync/order/:orderId', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await integration_1.integrationManager.syncOrderToIntegrations(orderId);
        res.json({
            success: result.success,
            results: result.results,
            message: result.success ? 'Order sync completed' : 'Order sync failed'
        });
    }
    catch (error) {
        console.error('Sync order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get available integration types
router.get('/types', auth_1.authenticate, async (req, res) => {
    try {
        const types = [
            {
                type: 'TOAST',
                name: 'Toast POS',
                description: 'Integration with Toast point-of-sale system',
                status: 'available',
                configFields: [
                    { name: 'clientId', type: 'string', required: true, description: 'Toast API Client ID' },
                    { name: 'clientSecret', type: 'password', required: true, description: 'Toast API Client Secret' },
                    { name: 'locationGuid', type: 'string', required: true, description: 'Toast Location GUID' },
                    { name: 'environment', type: 'select', required: true, description: 'Environment', options: ['sandbox', 'production'] }
                ]
            },
            {
                type: 'SQUARE',
                name: 'Square POS',
                description: 'Integration with Square point-of-sale system',
                status: 'coming_soon',
                configFields: [
                    { name: 'accessToken', type: 'password', required: true, description: 'Square Access Token' },
                    { name: 'applicationId', type: 'string', required: true, description: 'Square Application ID' },
                    { name: 'locationId', type: 'string', required: true, description: 'Square Location ID' }
                ]
            }
        ];
        res.json({ types });
    }
    catch (error) {
        console.error('Get integration types error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Admin: Get all restaurants with integration status
router.get('/admin/restaurants', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const restaurants = await index_1.prisma.restaurant.findMany({
            include: {
                school: true,
                integrationConfigs: true
            },
            orderBy: { name: 'asc' }
        });
        const restaurantsWithIntegration = restaurants.map((restaurant) => ({
            id: restaurant.id,
            name: restaurant.name,
            school: restaurant.school.name,
            toastLocationGuid: restaurant.toastLocationGuid,
            integrationEnabled: restaurant.integrationEnabled,
            integrations: restaurant.integrationConfigs.map((config) => ({
                type: config.integrationType,
                enabled: config.enabled,
                syncEnabled: config.syncEnabled,
                lastSync: config.lastSyncAt
            }))
        }));
        res.json({ restaurants: restaurantsWithIntegration });
    }
    catch (error) {
        console.error('Get admin restaurants integration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Admin: Enable integration for restaurant
router.post('/admin/enable', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { restaurantId, type, config } = req.body;
        if (!restaurantId || !type || !config) {
            res.status(400).json({ error: 'Restaurant ID, integration type, and config are required' });
            return;
        }
        const result = await integration_1.integrationManager.enableIntegration(restaurantId, type, config);
        if (result.success) {
            res.json({ success: true, message: `${type} integration enabled for restaurant` });
        }
        else {
            res.status(400).json({ error: result.error });
        }
    }
    catch (error) {
        console.error('Admin enable integration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=integrations.js.map