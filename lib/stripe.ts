import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = new Stripe(stripeSecretKey || 'sk_test_dummy_key_for_build', {
  apiVersion: '2024-12-18.acacia' as any,
});
