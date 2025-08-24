// # Server Configuration
// NODE_ENV=development
// PORT=3001

// # Supabase Configuration
// SUPABASE_URL=your_supabase_project_url
// SUPABASE_ANON_KEY=your_supabase_anon_key
// SUPABASE_SERVICE_KEY=your_supabase_service_role_key

// # JWT Configuration
// JWT_SECRET=your_jwt_secret_key
// JWT_EXPIRES_IN=7d

// # External AI APIs
// OPENAI_API_KEY=your_openai_api_key
// RUNWAY_API_KEY=your_runway_api_key
// STABLE_VIDEO_API_KEY=your_stable_video_api_key
// ELEVENLABS_API_KEY=your_elevenlabs_api_key

// # Stripe Configuration
// STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
// STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
// STRIPE_STARTER_PRICE_ID=price_your_starter_plan_price_id
// STRIPE_PROFESSIONAL_PRICE_ID=price_your_professional_plan_price_id
// STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_plan_price_id

// # CORS Configuration
// FRONTEND_URL=http://localhost:3000

export const env = {
  STRIPE: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
    STARTER_PRICE_ID: process.env.STRIPE_STARTER_PRICE_ID!,
    PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID!,
    stripeEnterprisePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
  },
  AI: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    RUNWAY_API_KEY: process.env.RUNWAY_API_KEY!,
    STABLE_VIDEO_API_KEY: process.env.STABLE_VIDEO_API_KEY!,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY!,
  },
  SUPABASE: {
    URL: process.env.SUPABASE_URL!,
    ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY!,
  },
  JWT: {
    SECRET: process.env.JWT_SECRET!,
    EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
  },
  APP: {
    PORT: process.env.PORT!,
    NODE_ENV: process.env.NODE_ENV!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
  },
};
