import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  // We use placeholder for build time if needed, but in runtime it must exist
  // console.warn('STRIPE_SECRET_KEY is missing from environment variables');
}

export const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2024-12-18.acacia' as any,
});
