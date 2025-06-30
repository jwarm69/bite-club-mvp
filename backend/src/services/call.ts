import twilio from 'twilio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.warn('[CALL_SERVICE] Twilio credentials not configured - calling disabled');
}

const client = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN 
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

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

export class CallService {
  
  /**
   * Generate TwiML for the IVR call
   */
  private generateTwiML(orderData: OrderCallData): string {
    const { orderId, customerName, orderTotal, items } = orderData;
    
    // Create item list for speech
    const itemsList = items.map(item => 
      `${item.quantity} ${item.name}`
    ).join(', ');

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="/api/calls/handle-response/${orderId}" method="POST" timeout="30">
    <Say voice="alice">
      Hello, this is Bite Club with a new order.
      Order number ${orderId.slice(-4)} for ${customerName}.
      Order total is $${orderTotal.toFixed(2)}.
      Items: ${itemsList}.
      
      Press 1 to accept this order.
      Press 2 to reject this order.
      Press 3 to repeat the order details.
      Press 0 for support.
    </Say>
  </Gather>
  
  <Say voice="alice">
    No response received. This order will remain pending. 
    Please check your Bite Club dashboard for order details. Goodbye.
  </Say>
  <Hangup/>
</Response>`;

    return twiml;
  }

  /**
   * Make an IVR call to a restaurant for an order
   */
  async makeOrderCall(orderData: OrderCallData): Promise<{ success: boolean; callSid?: string; error?: string }> {
    try {
      if (!client) {
        throw new Error('Twilio client not configured');
      }

      // Get restaurant details
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: orderData.restaurantId }
      });

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      if (!restaurant.callEnabled) {
        console.log('[CALL_SERVICE] Calling disabled for restaurant:', restaurant.name);
        return { success: false, error: 'Calling disabled' };
      }

      const phoneNumber = restaurant.callPhone || restaurant.phone;
      if (!phoneNumber) {
        throw new Error('No phone number configured for restaurant');
      }

      // Generate the TwiML URL for this order
      const webhookUrl = `${process.env.APP_URL || 'http://localhost:3001'}/api/calls/twiml/${orderData.orderId}`;

      console.log('[CALL_SERVICE] Making call to:', phoneNumber, 'for order:', orderData.orderId);

      // Make the call
      const call = await client.calls.create({
        url: webhookUrl,
        to: phoneNumber,
        from: TWILIO_PHONE_NUMBER!,
        timeout: restaurant.callTimeoutSeconds,
        statusCallback: `${process.env.APP_URL || 'http://localhost:3001'}/api/calls/status-callback`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST'
      });

      // Log the call attempt
      await prisma.callLog.create({
        data: {
          orderId: orderData.orderId,
          restaurantId: orderData.restaurantId,
          callTime: new Date(),
          twilioCallSid: call.sid,
          responseType: 'INITIATED',
          success: false // Will be updated when call completes
        }
      });

      console.log('[CALL_SERVICE] Call initiated:', call.sid);
      return { success: true, callSid: call.sid };

    } catch (error) {
      console.error('[CALL_SERVICE] Error making call:', error);
      
      // Log failed call attempt
      await prisma.callLog.create({
        data: {
          orderId: orderData.orderId,
          restaurantId: orderData.restaurantId,
          callTime: new Date(),
          responseType: 'FAILED',
          success: false,
          responseData: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      });

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Handle call status callbacks from Twilio
   */
  async handleStatusCallback(callSid: string, callStatus: string, duration?: string): Promise<void> {
    try {
      const callDuration = duration ? parseInt(duration) : null;
      const cost = callDuration ? this.calculateCallCost(callDuration) : null;

      await prisma.callLog.updateMany({
        where: { twilioCallSid: callSid },
        data: {
          duration: callDuration,
          cost: cost,
          responseData: { callStatus }
        }
      });

      console.log('[CALL_SERVICE] Call status updated:', callSid, callStatus);
    } catch (error) {
      console.error('[CALL_SERVICE] Error updating call status:', error);
    }
  }

  /**
   * Handle IVR responses from restaurants
   */
  async handleIVRResponse(orderId: string, digits: string): Promise<string> {
    try {
      let responseType: string;
      let responseMessage: string;
      let success = false;

      switch (digits) {
        case '1':
          responseType = 'ACCEPTED';
          responseMessage = 'Order accepted. Customer will arrive in 15 to 20 minutes. Thank you! Goodbye.';
          success = true;
          
          // Update order status
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'CONFIRMED' }
          });
          break;

        case '2':
          responseType = 'REJECTED';
          responseMessage = 'Order rejected. The customer will be notified. Goodbye.';
          success = false;
          
          // Update order status
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' }
          });
          break;

        case '3':
          // Repeat order details - redirect back to main menu
          return this.getOrderDetailsForRepeat(orderId);

        case '0':
          responseType = 'SUPPORT_REQUESTED';
          responseMessage = 'Connecting you to support. Please hold.';
          success = false;
          break;

        default:
          responseType = 'INVALID_RESPONSE';
          responseMessage = 'Invalid selection. Order remains pending. Please check your Bite Club dashboard. Goodbye.';
          success = false;
      }

      // Update call log with response
      await prisma.callLog.updateMany({
        where: { orderId },
        data: {
          keypadResponse: digits,
          responseType,
          success
        }
      });

      console.log('[CALL_SERVICE] IVR response processed:', orderId, digits, responseType);

      // Return TwiML response
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${responseMessage}</Say>
  <Hangup/>
</Response>`;

    } catch (error) {
      console.error('[CALL_SERVICE] Error handling IVR response:', error);
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error processing your response. Please check your Bite Club dashboard. Goodbye.</Say>
  <Hangup/>
</Response>`;
    }
  }

  /**
   * Get TwiML for an order (main IVR menu)
   */
  async getOrderTwiML(orderId: string): Promise<string> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          orderItems: {
            include: {
              menuItem: true
            }
          }
        }
      });

      if (!order) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Order not found. Goodbye.</Say>
  <Hangup/>
</Response>`;
      }

      const orderData: OrderCallData = {
        orderId: order.id,
        restaurantId: order.restaurantId,
        customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Customer',
        orderTotal: Number(order.finalAmount),
        items: order.orderItems.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: Number(item.totalPrice)
        }))
      };

      return this.generateTwiML(orderData);
    } catch (error) {
      console.error('[CALL_SERVICE] Error generating TwiML:', error);
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error. Please check your Bite Club dashboard. Goodbye.</Say>
  <Hangup/>
</Response>`;
    }
  }

  /**
   * Get order details for repeat (option 3)
   */
  private async getOrderDetailsForRepeat(orderId: string): Promise<string> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          orderItems: {
            include: {
              menuItem: true
            }
          }
        }
      });

      if (!order) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Order not found. Goodbye.</Say>
  <Hangup/>
</Response>`;
      }

      const customerName = `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Customer';
      const itemsList = order.orderItems.map(item => 
        `${item.quantity} ${item.menuItem.name}`
      ).join(', ');

      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="/api/calls/handle-response/${orderId}" method="POST" timeout="30">
    <Say voice="alice">
      Order details: Order number ${orderId.slice(-4)} for ${customerName}.
      Total: $${Number(order.finalAmount).toFixed(2)}.
      Items: ${itemsList}.
      
      Press 1 to accept this order.
      Press 2 to reject this order.
      Press 3 to repeat again.
      Press 0 for support.
    </Say>
  </Gather>
  
  <Say voice="alice">No response received. Order remains pending. Goodbye.</Say>
  <Hangup/>
</Response>`;
    } catch (error) {
      console.error('[CALL_SERVICE] Error getting order details:', error);
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Error retrieving order details. Goodbye.</Say>
  <Hangup/>
</Response>`;
    }
  }

  /**
   * Calculate call cost (Twilio pricing: ~$0.0085 per minute)
   */
  private calculateCallCost(durationSeconds: number): number {
    const durationMinutes = Math.ceil(durationSeconds / 60);
    const costPerMinute = 0.0085; // Twilio US pricing
    return durationMinutes * costPerMinute;
  }

  /**
   * Retry failed calls
   */
  async retryFailedCall(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          restaurant: true,
          orderItems: {
            include: {
              menuItem: true
            }
          }
        }
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Check retry limit
      const callLogs = await prisma.callLog.findMany({
        where: { orderId }
      });

      if (callLogs.length >= order.restaurant.callRetries + 1) {
        return { success: false, error: 'Maximum retry attempts exceeded' };
      }

      const orderData: OrderCallData = {
        orderId: order.id,
        restaurantId: order.restaurantId,
        customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Customer',
        orderTotal: Number(order.finalAmount),
        items: order.orderItems.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: Number(item.totalPrice)
        }))
      };

      return await this.makeOrderCall(orderData);
    } catch (error) {
      console.error('[CALL_SERVICE] Error retrying call:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const callService = new CallService();