import Stripe from 'stripe';
declare const stripeEnabled: boolean;
declare const stripe: Stripe;
export interface CreditPurchaseData {
    userId: string;
    amount: number;
    paymentMethodId: string;
}
export interface CreateCheckoutSessionData {
    userId: string;
    amount: number;
    successUrl: string;
    cancelUrl: string;
}
export declare const createCreditPaymentIntent: (data: CreditPurchaseData) => Promise<Stripe.Response<Stripe.PaymentIntent>>;
export declare const createCreditCheckoutSession: (data: CreateCheckoutSessionData) => Promise<Stripe.Response<Stripe.Checkout.Session>>;
export declare const handleSuccessfulPayment: (paymentIntentId: string, userId: string, amount: number) => Promise<any>;
export declare const processRefund: (paymentIntentId: string, amount?: number) => Promise<Stripe.Response<Stripe.Refund>>;
export declare const getCustomerPaymentMethods: (customerId: string) => Promise<Stripe.Response<Stripe.ApiList<Stripe.PaymentMethod>>>;
export { stripe, stripeEnabled };
//# sourceMappingURL=stripe.d.ts.map