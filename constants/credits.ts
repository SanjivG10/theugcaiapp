export const CREDIT_COSTS = {
  VIDEO_SCRIPT_GENERATION: 1,
  IMAGE_GENERATION: 2,
  VIDEO_GENERATION: 10,
  VIDEO_PROMPTS_GENERATION: 1,
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    monthlyCredits: 10,
    creditPrice: 0.10, // $0.10 per credit
    maxCreditsPerPurchase: 50,
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    monthlyCredits: 100,
    creditPrice: 0.08, // $0.08 per credit
    maxCreditsPerPurchase: 200,
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    price: 99,
    monthlyCredits: 500,
    creditPrice: 0.06, // $0.06 per credit
    maxCreditsPerPurchase: 1000,
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    monthlyCredits: 2000,
    creditPrice: 0.04, // $0.04 per credit
    maxCreditsPerPurchase: 5000,
  },
} as const;

export const CREDIT_PURCHASE_PACKAGES = [
  { credits: 25, label: '25 Credits' },
  { credits: 50, label: '50 Credits' },
  { credits: 100, label: '100 Credits' },
  { credits: 250, label: '250 Credits' },
  { credits: 500, label: '500 Credits' },
] as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
export type CreditAction = keyof typeof CREDIT_COSTS;