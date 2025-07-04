export interface POSIntegration {
    validateConfig(config: any): Promise<boolean>;
    syncMenu(restaurantId: string, config: any): Promise<{
        success: boolean;
        itemsUpdated: number;
        errors?: string[];
    }>;
    syncOrder(orderId: string, config: any): Promise<{
        success: boolean;
        externalOrderId?: string;
        error?: string;
    }>;
    getOrderStatus(externalOrderId: string, config: any): Promise<{
        status: string;
        estimatedTime?: number;
    }>;
    syncInventory?(restaurantId: string, config: any): Promise<{
        success: boolean;
        updatedItems: number;
    }>;
}
export declare class ToastIntegration implements POSIntegration {
    validateConfig(config: any): Promise<boolean>;
    syncMenu(restaurantId: string, config: any): Promise<{
        success: boolean;
        itemsUpdated: number;
        errors?: string[];
    }>;
    syncOrder(orderId: string, config: any): Promise<{
        success: boolean;
        externalOrderId?: string;
        error?: string;
    }>;
    getOrderStatus(externalOrderId: string, config: any): Promise<{
        status: string;
        estimatedTime?: number;
    }>;
}
export declare class SquareIntegration implements POSIntegration {
    validateConfig(config: any): Promise<boolean>;
    syncMenu(restaurantId: string, config: any): Promise<{
        success: boolean;
        itemsUpdated: number;
        errors?: string[];
    }>;
    syncOrder(orderId: string, config: any): Promise<{
        success: boolean;
        externalOrderId?: string;
        error?: string;
    }>;
    getOrderStatus(externalOrderId: string, config: any): Promise<{
        status: string;
        estimatedTime?: number;
    }>;
}
export declare class IntegrationManager {
    private integrations;
    constructor();
    getIntegration(type: string): POSIntegration | null;
    validateIntegrationConfig(type: string, config: any): Promise<boolean>;
    enableIntegration(restaurantId: string, type: string, config: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    disableIntegration(restaurantId: string, type: string): Promise<{
        success: boolean;
    }>;
    syncRestaurantMenu(restaurantId: string, integrationType?: string): Promise<{
        success: boolean;
        results: any[];
    }>;
    syncOrderToIntegrations(orderId: string): Promise<{
        success: boolean;
        results: any[];
    }>;
    getIntegrationStatus(restaurantId: string): Promise<{
        integrations: any[];
    }>;
}
export declare const integrationManager: IntegrationManager;
export declare function getRestaurantToastConfig(restaurantId: string): Promise<any | null>;
export declare function updateRestaurantToastGuid(restaurantId: string, toastLocationGuid: string): Promise<void>;
//# sourceMappingURL=integration.d.ts.map