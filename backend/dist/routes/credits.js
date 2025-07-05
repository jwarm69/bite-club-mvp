"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const stripe_1 = require("../services/stripe");
const router = express_1.default.Router();
// Get user's credit balance and transaction history
router.get('/balance', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await index_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create Stripe checkout session for credit purchase
router.post('/purchase/checkout', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { amount } = req.body;
        // Validate amount
        const validAmounts = [10, 25, 50, 100];
        if (!validAmounts.includes(amount)) {
            res.status(400).json({ error: 'Invalid amount. Must be $10, $25, $50, or $100' });
            return;
        }
        const session = await (0, stripe_1.createCreditCheckoutSession)({
            userId,
            amount,
            successUrl: `${process.env.FRONTEND_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${process.env.FRONTEND_URL}/credits/cancel`
        });
        res.json({
            sessionId: session.id,
            url: session.url
        });
    }
    catch (error) {
        console.error('Create checkout session error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});
// Create Payment Intent for credit purchase (for custom payment flow)
router.post('/purchase/intent', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), async (req, res) => {
    try {
        const userId = req.user.userId;
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
        const paymentIntent = await (0, stripe_1.createCreditPaymentIntent)({
            userId,
            amount,
            paymentMethodId
        });
        res.json({
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            status: paymentIntent.status
        });
    }
    catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});
// Handle successful payment confirmation
router.post('/purchase/confirm', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { paymentIntentId, sessionId } = req.body;
        let amount = 0;
        let stripePaymentId = '';
        if (paymentIntentId) {
            // Handle Payment Intent confirmation
            const paymentIntent = await stripe_1.stripe.paymentIntents.retrieve(paymentIntentId);
            amount = paymentIntent.amount / 100; // Convert from cents
            stripePaymentId = paymentIntentId;
        }
        else if (sessionId) {
            // Handle Checkout Session confirmation
            const session = await stripe_1.stripe.checkout.sessions.retrieve(sessionId);
            amount = (session.amount_total || 0) / 100; // Convert from cents
            stripePaymentId = session.payment_intent;
        }
        else {
            res.status(400).json({ error: 'Payment Intent ID or Session ID is required' });
            return;
        }
        // Add credits to user account
        const result = await (0, stripe_1.handleSuccessfulPayment)(stripePaymentId, userId, amount);
        res.json({
            message: 'Credits added successfully',
            newBalance: result.user.creditBalance,
            transaction: result.transaction
        });
    }
    catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
});
// Webhook endpoint for Stripe events
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe_1.stripeEnabled || !stripe_1.stripe) {
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
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
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
                    await (0, stripe_1.handleSuccessfulPayment)(paymentIntent.id, userId, parseFloat(creditAmount));
                }
                break;
            case 'checkout.session.completed':
                const session = event.data.object;
                const sessionUserId = session.metadata?.userId;
                const sessionCreditAmount = session.metadata?.creditAmount;
                if (sessionUserId && sessionCreditAmount && session.payment_intent) {
                    await (0, stripe_1.handleSuccessfulPayment)(session.payment_intent, sessionUserId, parseFloat(sessionCreditAmount));
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
    }
    catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});
// Admin endpoint to manually add credits
router.post('/admin/add', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { userId, amount, reason } = req.body;
        if (!userId || !amount || amount <= 0) {
            res.status(400).json({ error: 'Valid user ID and amount are required' });
            return;
        }
        const result = await index_1.prisma.$transaction(async (tx) => {
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
    }
    catch (error) {
        console.error('Admin add credits error:', error);
        res.status(500).json({ error: 'Failed to add credits' });
    }
});
exports.default = router;
//# sourceMappingURL=credits.js.map