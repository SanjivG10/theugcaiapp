export const CREDIT_COSTS = {
  script: 1,
  image: 2,
  video: 10,
  prompt: 1,
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "Free",
    monthlyCredits: 10,
    creditPrice: 0.1,
    price: 0,
    stripeProductId: null,
  },
  STARTER: {
    name: "Starter",
    monthlyCredits: 100,
    creditPrice: 0.05,
    price: 19,
    stripeProductId: process.env.STRIPE_STARTER_PRODUCT_ID,
  },
  PROFESSIONAL: {
    name: "Professional",
    monthlyCredits: 500,
    creditPrice: 0.03,
    price: 49,
    stripeProductId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID,
  },
  ENTERPRISE: {
    name: "Enterprise",
    monthlyCredits: 2000,
    creditPrice: 0.02,
    price: 149,
    stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID,
  },
} as const;