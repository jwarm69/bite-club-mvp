"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationManager = exports.IntegrationManager = exports.SquareIntegration = exports.ToastIntegration = void 0;
exports.getRestaurantToastConfig = getRestaurantToastConfig;
exports.updateRestaurantToastGuid = updateRestaurantToastGuid;
const index_1 = require("../index");
// Toast POS Integration
class ToastIntegration {
    async validateConfig(config) {
        const required = ['clientId', 'clientSecret', 'locationGuid', 'environment'];
        return required.every(field => config[field]);
    }
    async syncMenu(restaurantId, config) {
        try {
            // TODO: Implement Toast menu sync
            console.log(`Syncing menu for restaurant ${restaurantId} with Toast`);
            // Placeholder for Toast API calls
            // const menuData = await this.getToastMenu(config);
            // const updatedItems = await this.updateLocalMenu(restaurantId, menuData);
            return { success: true, itemsUpdated: 0 };
        }
        catch (error) {
            console.error('Toast menu sync error:', error);
            return { success: false, itemsUpdated: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
        }
    }
    async syncOrder(orderId, config) {
        try {
            // TODO: Implement Toast order sync
            console.log(`Syncing order ${orderId} with Toast`);
            // Placeholder for Toast order creation
            // const toastOrder = await this.createToastOrder(orderId, config);
            return { success: true, externalOrderId: `toast_${orderId}` };
        }
        catch (error) {
            console.error('Toast order sync error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async getOrderStatus(externalOrderId, config) {
        try {
            // TODO: Implement Toast order status check
            console.log(`Checking Toast order status for ${externalOrderId}`);
            // Placeholder status mapping
            return { status: 'PREPARING', estimatedTime: 15 };
        }
        catch (error) {
            console.error('Toast order status error:', error);
            return { status: 'UNKNOWN' };
        }
    }
}
exports.ToastIntegration = ToastIntegration;
// Square POS Integration (future)
class SquareIntegration {
    async validateConfig(config) {
        const required = ['accessToken', 'applicationId', 'locationId'];
        return required.every(field => config[field]);
    }
    async syncMenu(restaurantId, config) {
        // TODO: Implement Square menu sync
        return { success: false, itemsUpdated: 0, errors: ['Square integration not implemented'] };
    }
    async syncOrder(orderId, config) {
        // TODO: Implement Square order sync
        return { success: false, error: 'Square integration not implemented' };
    }
    async getOrderStatus(externalOrderId, config) {
        // TODO: Implement Square order status
        return { status: 'UNKNOWN' };
    }
}
exports.SquareIntegration = SquareIntegration;
// Integration Manager
class IntegrationManager {
    constructor() {
        this.integrations = new Map();
        this.integrations.set('TOAST', new ToastIntegration());
        this.integrations.set('SQUARE', new SquareIntegration());
    }
    getIntegration(type) {
        return this.integrations.get(type.toUpperCase()) || null;
    }
    async validateIntegrationConfig(type, config) {
        const integration = this.getIntegration(type);
        if (!integration)
            return false;
        return integration.validateConfig(config);
    }
    async enableIntegration(restaurantId, type, config) {
        try {
            const integration = this.getIntegration(type);
            if (!integration) {
                return { success: false, error: `Integration type ${type} not supported` };
            }
            const isValid = await integration.validateConfig(config);
            if (!isValid) {
                return { success: false, error: 'Invalid configuration' };
            }
            // Save or update integration config
            await (await (0, index_1.getPrisma)()).integrationConfig.upsert({
                where: {
                    restaurantId_integrationType: {
                        restaurantId,
                        integrationType: type.toUpperCase()
                    }
                },
                update: {
                    configData: config,
                    enabled: true,
                    lastSyncAt: new Date()
                },
                create: {
                    restaurantId,
                    integrationType: type.toUpperCase(),
                    configData: config,
                    enabled: true
                }
            });
            return { success: true };
        }
        catch (error) {
            console.error('Enable integration error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async disableIntegration(restaurantId, type) {
        try {
            await (await (0, index_1.getPrisma)()).integrationConfig.update({
                where: {
                    restaurantId_integrationType: {
                        restaurantId,
                        integrationType: type.toUpperCase()
                    }
                },
                data: { enabled: false }
            });
            return { success: true };
        }
        catch (error) {
            console.error('Disable integration error:', error);
            return { success: false };
        }
    }
    async syncRestaurantMenu(restaurantId, integrationType) {
        try {
            const configs = await (await (0, index_1.getPrisma)()).integrationConfig.findMany({
                where: {
                    restaurantId,
                    enabled: true,
                    ...(integrationType && { integrationType: integrationType.toUpperCase() })
                }
            });
            const results = [];
            for (const config of configs) {
                const integration = this.getIntegration(config.integrationType);
                if (integration) {
                    const result = await integration.syncMenu(restaurantId, config.configData);
                    results.push({
                        type: config.integrationType,
                        ...result
                    });
                }
            }
            return { success: true, results };
        }
        catch (error) {
            console.error('Sync restaurant menu error:', error);
            return { success: false, results: [] };
        }
    }
    async syncOrderToIntegrations(orderId) {
        try {
            const order = await (await (0, index_1.getPrisma)()).order.findUnique({
                where: { id: orderId },
                include: { restaurant: true }
            });
            if (!order) {
                return { success: false, results: [] };
            }
            const configs = await (await (0, index_1.getPrisma)()).integrationConfig.findMany({
                where: {
                    restaurantId: order.restaurantId,
                    enabled: true,
                    syncEnabled: true
                }
            });
            const results = [];
            for (const config of configs) {
                const integration = this.getIntegration(config.integrationType);
                if (integration) {
                    const result = await integration.syncOrder(orderId, config.configData);
                    results.push({
                        type: config.integrationType,
                        ...result
                    });
                    // Update order with external ID if successful
                    if (result.success && result.externalOrderId) {
                        const externalData = order.externalOrderData || {};
                        externalData[config.integrationType.toLowerCase()] = {
                            orderId: result.externalOrderId,
                            syncedAt: new Date()
                        };
                        await (await (0, index_1.getPrisma)()).order.update({
                            where: { id: orderId },
                            data: {
                                externalOrderData: externalData,
                                integrationStatus: 'SYNCED'
                            }
                        });
                    }
                }
            }
            return { success: true, results };
        }
        catch (error) {
            console.error('Sync order to integrations error:', error);
            return { success: false, results: [] };
        }
    }
    async getIntegrationStatus(restaurantId) {
        try {
            const configs = await (await (0, index_1.getPrisma)()).integrationConfig.findMany({
                where: { restaurantId },
                orderBy: { integrationType: 'asc' }
            });
            const integrations = configs.map(config => ({
                type: config.integrationType,
                enabled: config.enabled,
                syncEnabled: config.syncEnabled,
                lastSync: config.lastSyncAt,
                hasValidConfig: this.getIntegration(config.integrationType) !== null
            }));
            return { integrations };
        }
        catch (error) {
            console.error('Get integration status error:', error);
            return { integrations: [] };
        }
    }
}
exports.IntegrationManager = IntegrationManager;
// Export singleton instance
exports.integrationManager = new IntegrationManager();
// Helper functions for specific integrations
async function getRestaurantToastConfig(restaurantId) {
    try {
        const config = await (await (0, index_1.getPrisma)()).integrationConfig.findUnique({
            where: {
                restaurantId_integrationType: {
                    restaurantId,
                    integrationType: 'TOAST'
                }
            }
        });
        return config?.enabled ? config.configData : null;
    }
    catch (error) {
        console.error('Get Toast config error:', error);
        return null;
    }
}
async function updateRestaurantToastGuid(restaurantId, toastLocationGuid) {
    try {
        await (await (0, index_1.getPrisma)()).restaurant.update({
            where: { id: restaurantId },
            data: { toastLocationGuid }
        });
    }
    catch (error) {
        console.error('Update Toast GUID error:', error);
    }
}
//# sourceMappingURL=integration.js.map