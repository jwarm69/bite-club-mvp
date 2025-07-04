interface OrderCallData {
    orderId: string;
    restaurantId: string;
    customerName: string;
    orderTotal: number;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
}
export declare class CallService {
    /**
     * Generate TwiML for the IVR call
     */
    private generateTwiML;
    /**
     * Make an IVR call to a restaurant for an order
     */
    makeOrderCall(orderData: OrderCallData): Promise<{
        success: boolean;
        callSid?: string;
        error?: string;
    }>;
    /**
     * Handle call status callbacks from Twilio
     */
    handleStatusCallback(callSid: string, callStatus: string, duration?: string): Promise<void>;
    /**
     * Handle IVR responses from restaurants
     */
    handleIVRResponse(orderId: string, digits: string): Promise<string>;
    /**
     * Get TwiML for an order (main IVR menu)
     */
    getOrderTwiML(orderId: string): Promise<string>;
    /**
     * Get order details for repeat (option 3)
     */
    private getOrderDetailsForRepeat;
    /**
     * Calculate call cost (Twilio pricing: ~$0.0085 per minute)
     */
    private calculateCallCost;
    /**
     * Retry failed calls
     */
    retryFailedCall(orderId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare const callService: CallService;
export {};
//# sourceMappingURL=call.d.ts.map