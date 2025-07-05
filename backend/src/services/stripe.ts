import Stripe from 'stripe';
import { getPrisma } from '../index';

// Gracefully handle missing Stripe keys for test deployment
const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
const stripe = stripeEnabled ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
}) : null;

export interface CreditPurchaseData {
  userId: string;
  amount: number; // in dollars
  paymentMethodId: string;
}

export interface CreateCheckoutSessionData {
  userId: string;
  amount: number; // in dollars
  successUrl: string;
  cancelUrl: string;
}

// Create payment intent for credit purchase
export const createCreditPaymentIntent = async (data: CreditPurchaseData) => {
  if (!stripeEnabled || !stripe) {
    throw new Error('Payment processing temporarily disabled - Stripe not configured');
  }

  try {
    const { userId, amount, paymentMethodId } = data;

    // Get user info
    const user = await (await getPrisma()).user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${process.env.FRONTEND_URL}/credits/success`,
      metadata: {
        userId,
        type: 'credit_purchase',
        creditAmount: amount.toString()
      },
      receipt_email: user.email,
      description: `Bite Club Credit Purchase - $${amount}`
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    throw error;
  }
};

// Create checkout session for credit purchase
export const createCreditCheckoutSession = async (data: CreateCheckoutSessionData) => {
  if (!stripeEnabled || !stripe) {
    throw new Error('Payment processing temporarily disabled - Stripe not configured');
  }

  try {
    const { userId, amount, successUrl, cancelUrl } = data;

    // Get user info
    const user = await (await getPrisma()).user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Bite Club Credits',
              description: `$${amount} in dining credits`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        userId,
        type: 'credit_purchase',
        creditAmount: amount.toString()
      }
    });

    return session;
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    throw error;
  }
};

// Handle successful payment and add credits
export const handleSuccessfulPayment = async (
  paymentIntentId: string,
  userId: string,
  amount: number
) => {
  if (!stripeEnabled || !stripe) {
    throw new Error('Payment processing temporarily disabled - Stripe not configured');
  }

  try {
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not successful');
    }

    // Add credits to user account in a transaction
    const result = await (await getPrisma()).$transaction(async (tx) => {
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
          type: 'PURCHASE',
          description: `Credit purchase via Stripe`,
          stripePaymentId: paymentIntentId
        }
      });

      return { user: updatedUser, transaction };
    });

    return result;
  } catch (error) {
    console.error('Handle successful payment error:', error);
    throw error;
  }
};

// Process refund
export const processRefund = async (
  paymentIntentId: string,
  amount?: number // Optional partial refund amount
) => {
  try {
    const refund = await stripe!.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined // Convert to cents if specified
    });

    return refund;
  } catch (error) {
    console.error('Stripe refund error:', error);
    throw error;
  }
};

// Get customer payment methods
export const getCustomerPaymentMethods = async (customerId: string) => {
  try {
    const paymentMethods = await stripe!.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods;
  } catch (error) {
    console.error('Get payment methods error:', error);
    throw error;
  }
};

export { stripe, stripeEnabled };