import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../index';

// Base interface for all POS integrations
export interface POSIntegration {
  validateConfig(config: any): Promise<boolean>;
  syncMenu(restaurantId: string, config: any): Promise<{ success: boolean; itemsUpdated: number; errors?: string[] }>;
  syncOrder(orderId: string, config: any): Promise<{ success: boolean; externalOrderId?: string; error?: string }>;
  getOrderStatus(externalOrderId: string, config: any): Promise<{ status: string; estimatedTime?: number }>;
  syncInventory?(restaurantId: string, config: any): Promise<{ success: boolean; updatedItems: number }>;
}

// Toast POS Integration
export class ToastIntegration implements POSIntegration {
  async validateConfig(config: any): Promise<boolean> {
    const required = ['clientId', 'clientSecret', 'locationGuid', 'environment'];
    return required.every(field => config[field]);
  }

  async syncMenu(restaurantId: string, config: any): Promise<{ success: boolean; itemsUpdated: number; errors?: string[] }> {
    try {
      // TODO: Implement Toast menu sync
      console.log(`Syncing menu for restaurant ${restaurantId} with Toast`);
      
      // Placeholder for Toast API calls
      // const menuData = await this.getToastMenu(config);
      // const updatedItems = await this.updateLocalMenu(restaurantId, menuData);
      
      return { success: true, itemsUpdated: 0 };
    } catch (error) {
      console.error('Toast menu sync error:', error);
      return { success: false, itemsUpdated: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  async syncOrder(orderId: string, config: any): Promise<{ success: boolean; externalOrderId?: string; error?: string }> {
    try {
      // TODO: Implement Toast order sync
      console.log(`Syncing order ${orderId} with Toast`);
      
      // Placeholder for Toast order creation
      // const toastOrder = await this.createToastOrder(orderId, config);
      
      return { success: true, externalOrderId: `toast_${orderId}` };
    } catch (error) {
      console.error('Toast order sync error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getOrderStatus(externalOrderId: string, config: any): Promise<{ status: string; estimatedTime?: number }> {
    try {
      // TODO: Implement Toast order status check
      console.log(`Checking Toast order status for ${externalOrderId}`);
      
      // Placeholder status mapping
      return { status: 'PREPARING', estimatedTime: 15 };
    } catch (error) {
      console.error('Toast order status error:', error);
      return { status: 'UNKNOWN' };
    }
  }
}

// Square POS Integration (future)
export class SquareIntegration implements POSIntegration {
  async validateConfig(config: any): Promise<boolean> {
    const required = ['accessToken', 'applicationId', 'locationId'];
    return required.every(field => config[field]);
  }

  async syncMenu(restaurantId: string, config: any): Promise<{ success: boolean; itemsUpdated: number; errors?: string[] }> {
    // TODO: Implement Square menu sync
    return { success: false, itemsUpdated: 0, errors: ['Square integration not implemented'] };
  }

  async syncOrder(orderId: string, config: any): Promise<{ success: boolean; externalOrderId?: string; error?: string }> {
    // TODO: Implement Square order sync
    return { success: false, error: 'Square integration not implemented' };
  }

  async getOrderStatus(externalOrderId: string, config: any): Promise<{ status: string; estimatedTime?: number }> {
    // TODO: Implement Square order status
    return { status: 'UNKNOWN' };
  }
}

// Integration Manager
export class IntegrationManager {
  private integrations: Map<string, POSIntegration> = new Map();

  constructor() {
    this.integrations.set('TOAST', new ToastIntegration());
    this.integrations.set('SQUARE', new SquareIntegration());
  }

  getIntegration(type: string): POSIntegration | null {
    return this.integrations.get(type.toUpperCase()) || null;
  }

  async validateIntegrationConfig(type: string, config: any): Promise<boolean> {
    const integration = this.getIntegration(type);
    if (!integration) return false;
    return integration.validateConfig(config);
  }

  async enableIntegration(restaurantId: string, type: string, config: any): Promise<{ success: boolean; error?: string }> {
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
      await (await getPrisma()).integrationConfig.upsert({
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
    } catch (error) {
      console.error('Enable integration error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async disableIntegration(restaurantId: string, type: string): Promise<{ success: boolean }> {
    try {
      await (await getPrisma()).integrationConfig.update({
        where: {
          restaurantId_integrationType: {
            restaurantId,
            integrationType: type.toUpperCase()
          }
        },
        data: { enabled: false }
      });

      return { success: true };
    } catch (error) {
      console.error('Disable integration error:', error);
      return { success: false };
    }
  }

  async syncRestaurantMenu(restaurantId: string, integrationType?: string): Promise<{ success: boolean; results: any[] }> {
    try {
      const configs = await (await getPrisma()).integrationConfig.findMany({
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
    } catch (error) {
      console.error('Sync restaurant menu error:', error);
      return { success: false, results: [] };
    }
  }

  async syncOrderToIntegrations(orderId: string): Promise<{ success: boolean; results: any[] }> {
    try {
      const order = await (await getPrisma()).order.findUnique({
        where: { id: orderId },
        include: { restaurant: true }
      });

      if (!order) {
        return { success: false, results: [] };
      }

      const configs = await (await getPrisma()).integrationConfig.findMany({
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
            const externalData = order.externalOrderData as any || {};
            externalData[config.integrationType.toLowerCase()] = {
              orderId: result.externalOrderId,
              syncedAt: new Date()
            };

            await (await getPrisma()).order.update({
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
    } catch (error) {
      console.error('Sync order to integrations error:', error);
      return { success: false, results: [] };
    }
  }

  async getIntegrationStatus(restaurantId: string): Promise<{ integrations: any[] }> {
    try {
      const configs = await (await getPrisma()).integrationConfig.findMany({
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
    } catch (error) {
      console.error('Get integration status error:', error);
      return { integrations: [] };
    }
  }
}

// Export singleton instance
export const integrationManager = new IntegrationManager();

// Helper functions for specific integrations
export async function getRestaurantToastConfig(restaurantId: string): Promise<any | null> {
  try {
    const config = await (await getPrisma()).integrationConfig.findUnique({
      where: {
        restaurantId_integrationType: {
          restaurantId,
          integrationType: 'TOAST'
        }
      }
    });

    return config?.enabled ? config.configData : null;
  } catch (error) {
    console.error('Get Toast config error:', error);
    return null;
  }
}

export async function updateRestaurantToastGuid(restaurantId: string, toastLocationGuid: string): Promise<void> {
  try {
    await (await getPrisma()).restaurant.update({
      where: { id: restaurantId },
      data: { toastLocationGuid }
    });
  } catch (error) {
    console.error('Update Toast GUID error:', error);
  }
}