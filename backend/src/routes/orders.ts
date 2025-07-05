import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { callService } from '../services/call';
import { getPrisma } from '../index';

const router = express.Router();

// Create a new order (Student only)
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, restaurantId, totalAmount, customInstructions } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get user to check credit balance
    const user = await (await getPrisma()).user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get restaurant promotions and customer relationship
    const restaurant = await (await getPrisma()).restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        restaurantPromotions: true
      }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    // Get or create customer relationship
    let customerRelationship = await (await getPrisma()).customerRelationship.findUnique({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId
        }
      }
    });

    if (!customerRelationship) {
      customerRelationship = await (await getPrisma()).customerRelationship.create({
        data: {
          userId,
          restaurantId,
          isFirstTime: true,
          totalSpent: 0,
          loyaltyProgress: 0
        }
      });
    }

    // Calculate promotions
    let discountAmount = 0;
    let finalAmount = totalAmount;
    let promotionApplied: string | null = null;
    let loyaltyRewardEarned = 0;

    if (restaurant.restaurantPromotions) {
      const promotions = restaurant.restaurantPromotions;

      // Apply first-time discount
      if (promotions.firstTimeEnabled && customerRelationship.isFirstTime) {
        discountAmount = totalAmount * (Number(promotions.firstTimePercent) / 100);
        promotionApplied = 'FIRST_TIME';
        console.log('[PROMOTION] First-time discount applied:', discountAmount);
      }

      // Check loyalty reward eligibility (after current order)
      if (promotions.loyaltyEnabled) {
        const newLoyaltyProgress = Number(customerRelationship.loyaltyProgress) + totalAmount;
        if (newLoyaltyProgress >= Number(promotions.loyaltySpendThreshold)) {
          loyaltyRewardEarned = Number(promotions.loyaltyRewardAmount);
          console.log('[PROMOTION] Loyalty reward earned:', loyaltyRewardEarned);
        }
      }
    }

    finalAmount = totalAmount - discountAmount;

    // Check if user has sufficient credits for final amount
    if (Number(user.creditBalance) < finalAmount) {
      res.status(400).json({ error: 'Insufficient credit balance' });
      return;
    }

    // Start transaction to create order and apply all changes
    const result = await (await getPrisma()).$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId,
          restaurantId,
          totalAmount,
          discountAmount,
          finalAmount,
          total: finalAmount, // For easier queries
          status: 'PENDING',
          promotionApplied,
          orderItems: {
            create: items.map((item: any) => ({
              menuItemId: item.menuItem.id,
              quantity: item.quantity,
              unitPrice: Number(item.menuItem.price),
              totalPrice: item.totalPrice,
              modifiersSelected: item.selectedModifiers || [],
              customInstructions: item.customInstructions || ''
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          },
          restaurant: true,
          user: true
        }
      });

      // Create promotion cost record if discount was applied
      if (discountAmount > 0) {
        await tx.promotionCost.create({
          data: {
            orderId: order.id,
            restaurantId,
            costAmount: discountAmount,
            promotionType: promotionApplied!,
            originalTotal: totalAmount,
            discountAmount
          }
        });
      }

      // Update customer relationship
      const newTotalSpent = Number(customerRelationship!.totalSpent) + totalAmount;
      let newLoyaltyProgress = Number(customerRelationship!.loyaltyProgress) + totalAmount;
      
      // Reset loyalty progress if reward was earned
      if (loyaltyRewardEarned > 0 && restaurant.restaurantPromotions?.loyaltyEnabled) {
        newLoyaltyProgress = newLoyaltyProgress - Number(restaurant.restaurantPromotions.loyaltySpendThreshold);
      }

      await tx.customerRelationship.update({
        where: {
          userId_restaurantId: {
            userId,
            restaurantId
          }
        },
        data: {
          isFirstTime: false,
          totalSpent: newTotalSpent,
          loyaltyProgress: Math.max(0, newLoyaltyProgress)
        }
      });

      // Add loyalty reward to user's credit balance
      if (loyaltyRewardEarned > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            creditBalance: {
              increment: loyaltyRewardEarned
            }
          }
        });

        // Record loyalty reward transaction
        await tx.creditTransaction.create({
          data: {
            userId,
            amount: loyaltyRewardEarned,
            type: 'LOYALTY_REWARD',
            description: `Loyalty reward from ${restaurant.name}`,
            orderId: order.id
          }
        });
      }

      // NOTE: Credits will be deducted only when restaurant ACCEPTS the order
      // This prevents students from being charged for orders that get rejected

      return { order, loyaltyRewardEarned, discountAmount };
    });

    console.log('[ORDER_CREATE] Order created successfully:', result.order.id);

    // Trigger automatic calling if enabled for the restaurant
    try {
      const orderCallData = {
        orderId: result.order.id,
        restaurantId: result.order.restaurantId,
        customerName: `${result.order.user.firstName || ''} ${result.order.user.lastName || ''}`.trim() || 'Customer',
        orderTotal: Number(result.order.finalAmount),
        items: result.order.orderItems.map((item: any) => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: Number(item.totalPrice)
        }))
      };

      // Make the call asynchronously (don't wait for completion)
      callService.makeOrderCall(orderCallData).catch(error => {
        console.error('[ORDER_CREATE] Call failed for order:', result.order.id, error);
      });
    } catch (error) {
      console.error('[ORDER_CREATE] Error initiating call:', error);
      // Don't fail the order creation if calling fails
    }

    res.status(201).json({ 
      order: result.order,
      promotions: {
        discountAmount: result.discountAmount,
        loyaltyRewardEarned: result.loyaltyRewardEarned,
        promotionApplied: result.order.promotionApplied
      }
    });

  } catch (error) {
    console.error('[ORDER_CREATE] Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user's orders (Student only)
router.get('/my-orders', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const orders = await (await getPrisma()).order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        restaurant: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ orders });

  } catch (error) {
    console.error('[ORDER_GET] Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get restaurant orders (Restaurant only)
router.get('/restaurant', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get restaurant for this user
    const restaurant = await (await getPrisma()).restaurant.findFirst({
      where: { userId }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    const whereClause: any = {
      restaurantId: restaurant.id
    };

    if (status) {
      whereClause.status = status;
    }

    const orders = await (await getPrisma()).order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ orders });

  } catch (error) {
    console.error('[ORDER_RESTAURANT_GET] Error fetching restaurant orders:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant orders' });
  }
});

// Update order status (Restaurant only)
router.patch('/:orderId/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get restaurant for this user
    const restaurant = await (await getPrisma()).restaurant.findFirst({
      where: { userId }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    // Verify this order belongs to this restaurant
    const existingOrder = await (await getPrisma()).order.findFirst({
      where: {
        id: orderId,
        restaurantId: restaurant.id
      }
    });

    if (!existingOrder) {
      res.status(404).json({ error: 'Order not found or access denied' });
      return;
    }

    // Update order status
    const updatedOrder = await (await getPrisma()).order.update({
      where: { id: orderId },
      data: { status },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    console.log('[ORDER_STATUS_UPDATE] Order status updated:', orderId, 'to', status);
    res.json({ order: updatedOrder });

  } catch (error) {
    console.error('[ORDER_STATUS_UPDATE] Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Check available promotions for a user at a restaurant (before checkout)
router.post('/check-promotions', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurantId, totalAmount } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get restaurant promotions
    const restaurant = await (await getPrisma()).restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        restaurantPromotions: true
      }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    // Get customer relationship
    const customerRelationship = await (await getPrisma()).customerRelationship.findUnique({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId
        }
      }
    });

    let availablePromotions: any = {
      firstTimeDiscount: null,
      loyaltyReward: null,
      finalAmount: totalAmount
    };

    if (restaurant.restaurantPromotions) {
      const promotions = restaurant.restaurantPromotions;

      // Check first-time discount
      if (promotions.firstTimeEnabled && (!customerRelationship || customerRelationship.isFirstTime)) {
        const discountAmount = totalAmount * (Number(promotions.firstTimePercent) / 100);
        availablePromotions.firstTimeDiscount = {
          percentage: Number(promotions.firstTimePercent),
          discountAmount,
          description: `${promotions.firstTimePercent}% off your first order!`
        };
        availablePromotions.finalAmount = totalAmount - discountAmount;
      }

      // Check loyalty reward eligibility
      if (promotions.loyaltyEnabled && customerRelationship) {
        const currentProgress = Number(customerRelationship.loyaltyProgress);
        const threshold = Number(promotions.loyaltySpendThreshold);
        const newProgress = currentProgress + totalAmount;
        
        if (newProgress >= threshold) {
          availablePromotions.loyaltyReward = {
            rewardAmount: Number(promotions.loyaltyRewardAmount),
            description: `Earn $${promotions.loyaltyRewardAmount} credit with this order!`
          };
        } else {
          availablePromotions.loyaltyProgress = {
            current: currentProgress,
            needed: threshold - newProgress,
            threshold,
            description: `Spend $${(threshold - newProgress).toFixed(2)} more to earn $${promotions.loyaltyRewardAmount} credit!`
          };
        }
      }
    }

    res.json({ promotions: availablePromotions });

  } catch (error) {
    console.error('[PROMOTION_CHECK] Error checking promotions:', error);
    res.status(500).json({ error: 'Failed to check promotions' });
  }
});

// Restaurant accepts order - charges student and confirms order
router.post('/:orderId/accept', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get restaurant for this user
    const restaurant = await (await getPrisma()).restaurant.findFirst({
      where: { userId }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    // Get the order and verify it belongs to this restaurant
    const order = await (await getPrisma()).order.findFirst({
      where: {
        id: orderId,
        restaurantId: restaurant.id,
        status: 'PENDING'
      },
      include: {
        user: true,
        restaurant: true
      }
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found, already processed, or access denied' });
      return;
    }

    // Check if student still has sufficient credits
    if (Number(order.user.creditBalance) < Number(order.finalAmount)) {
      res.status(400).json({ error: 'Student has insufficient credit balance' });
      return;
    }

    // Process the acceptance in a transaction
    const result = await (await getPrisma()).$transaction(async (tx) => {
      // Charge the student's credits
      await tx.user.update({
        where: { id: order.userId },
        data: {
          creditBalance: {
            decrement: Number(order.finalAmount)
          }
        }
      });

      // Record the spending transaction
      await tx.creditTransaction.create({
        data: {
          userId: order.userId,
          amount: -Number(order.finalAmount),
          type: 'SPEND',
          description: `Order from ${order.restaurant.name}`,
          orderId: order.id
        }
      });

      // Update order status to confirmed
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return updatedOrder;
    });

    console.log('[ORDER_ACCEPT] Order accepted and student charged:', orderId);
    res.json({ order: result, message: 'Order accepted and student charged' });

  } catch (error) {
    console.error('[ORDER_ACCEPT] Error accepting order:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// Restaurant rejects order - no charge to student
router.post('/:orderId/reject', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get restaurant for this user
    const restaurant = await (await getPrisma()).restaurant.findFirst({
      where: { userId }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    // Get the order and verify it belongs to this restaurant
    const order = await (await getPrisma()).order.findFirst({
      where: {
        id: orderId,
        restaurantId: restaurant.id,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found, already processed, or access denied' });
      return;
    }

    // Update order status to cancelled (no credit charge)
    const updatedOrder = await (await getPrisma()).order.update({
      where: { id: orderId },
      data: { 
        status: 'CANCELLED',
        refundReason: reason || 'Order rejected by restaurant'
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    console.log('[ORDER_REJECT] Order rejected, no charge to student:', orderId);
    res.json({ order: updatedOrder, message: 'Order rejected, student not charged' });

  } catch (error) {
    console.error('[ORDER_REJECT] Error rejecting order:', error);
    res.status(500).json({ error: 'Failed to reject order' });
  }
});

// Restaurant completes order (closeout)
router.post('/:orderId/closeout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get restaurant for this user
    const restaurant = await (await getPrisma()).restaurant.findFirst({
      where: { userId }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    // Get the order and verify it belongs to this restaurant
    const order = await (await getPrisma()).order.findFirst({
      where: {
        id: orderId,
        restaurantId: restaurant.id,
        status: 'CONFIRMED'
      }
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found, not confirmed, or access denied' });
      return;
    }

    // Update order status to completed
    const updatedOrder = await (await getPrisma()).order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    console.log('[ORDER_CLOSEOUT] Order completed:', orderId);
    res.json({ order: updatedOrder, message: 'Order completed' });

  } catch (error) {
    console.error('[ORDER_CLOSEOUT] Error completing order:', error);
    res.status(500).json({ error: 'Failed to complete order' });
  }
});

export default router;