import express, { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import { 
  createCreditCheckoutSession, 
  createCreditPaymentIntent,
  handleSuccessfulPayment,
  stripe,
  stripeEnabled
} from '../services/stripe';

const router = express.Router();

// Get user's credit balance and transaction history
router.get('/balance', authenticate, authorize(UserRole.STUDENT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        creditBalance: true,
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            amount: true,
            type: true,
            description: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      balance: user.creditBalance,
      transactions: user.creditTransactions
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Stripe checkout session for credit purchase
router.post('/purchase/checkout', authenticate, authorize(UserRole.STUDENT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { amount } = req.body;

    // Validate amount
    const validAmounts = [10, 25, 50, 100];
    if (!validAmounts.includes(amount)) {
      res.status(400).json({ error: 'Invalid amount. Must be $10, $25, $50, or $100' });
      return;
    }

    const session = await createCreditCheckoutSession({
      userId,
      amount,
      successUrl: `${process.env.FRONTEND_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.FRONTEND_URL}/credits/cancel`
    });

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create Payment Intent for credit purchase (for custom payment flow)
router.post('/purchase/intent', authenticate, authorize(UserRole.STUDENT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { amount, paymentMethodId } = req.body;

    // Validate amount
    const validAmounts = [10, 25, 50, 100];
    if (!validAmounts.includes(amount)) {
      res.status(400).json({ error: 'Invalid amount. Must be $10, $25, $50, or $100' });
      return;
    }

    if (!paymentMethodId) {
      res.status(400).json({ error: 'Payment method ID is required' });
      return;
    }

    const paymentIntent = await createCreditPaymentIntent({
      userId,
      amount,
      paymentMethodId
    });

    res.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Handle successful payment confirmation
router.post('/purchase/confirm', authenticate, authorize(UserRole.STUDENT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { paymentIntentId, sessionId } = req.body;

    let amount = 0;
    let stripePaymentId = '';

    if (paymentIntentId) {
      // Handle Payment Intent confirmation
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      amount = paymentIntent.amount / 100; // Convert from cents
      stripePaymentId = paymentIntentId;
    } else if (sessionId) {
      // Handle Checkout Session confirmation
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      amount = (session.amount_total || 0) / 100; // Convert from cents
      stripePaymentId = session.payment_intent as string;
    } else {
      res.status(400).json({ error: 'Payment Intent ID or Session ID is required' });
      return;
    }

    // Add credits to user account
    const result = await handleSuccessfulPayment(stripePaymentId, userId, amount);

    res.json({
      message: 'Credits added successfully',
      newBalance: result.user.creditBalance,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<void> => {
  if (!stripeEnabled || !stripe) {
    res.status(503).json({ error: 'Payment processing temporarily disabled' });
    return;
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    res.status(400).json({ error: 'Missing signature or webhook secret' });
    return;
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const { userId, creditAmount } = paymentIntent.metadata;

        if (userId && creditAmount) {
          await handleSuccessfulPayment(
            paymentIntent.id,
            userId,
            parseFloat(creditAmount)
          );
        }
        break;

      case 'checkout.session.completed':
        const session = event.data.object;
        const sessionUserId = session.metadata?.userId;
        const sessionCreditAmount = session.metadata?.creditAmount;

        if (sessionUserId && sessionCreditAmount && session.payment_intent) {
          await handleSuccessfulPayment(
            session.payment_intent as string,
            sessionUserId,
            parseFloat(sessionCreditAmount)
          );
        }
        break;

      case 'payment_intent.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Admin endpoint to manually add credits
router.post('/admin/add', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !amount || amount <= 0) {
      res.status(400).json({ error: 'Valid user ID and amount are required' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update user credit balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          creditBalance: {
            increment: amount
          }
        }
      });

      // Create credit transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          type: 'ADMIN_ADD',
          description: reason || 'Manually added by admin'
        }
      });

      return { user: updatedUser, transaction };
    });

    res.json({
      message: 'Credits added successfully',
      newBalance: result.user.creditBalance,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Admin add credits error:', error);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

export default router;