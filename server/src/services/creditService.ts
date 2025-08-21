import { supabaseAdmin } from "../config/supabase";
import {
  CREDIT_COSTS,
  SUBSCRIPTION_PLANS,
  type CreditAction,
  type SubscriptionPlan,
} from "../config/credits";
import Stripe from "stripe";
import { env } from "../config/env";

const stripe = new Stripe(env.STRIPE.SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export class CreditService {
  /**
   * Get business credit information
   */
  static async getBusinessCredits(businessId: string) {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select(
        "credits, subscription_plan, subscription_status, subscription_expires_at"
      )
      .eq("id", businessId)
      .single();

    if (error) {
      throw new Error(`Failed to get business credits: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if business has sufficient credits for an action
   */
  static async hasSufficientCredits(
    businessId: string,
    action: CreditAction
  ): Promise<boolean> {
    const business = await this.getBusinessCredits(businessId);
    const requiredCredits = CREDIT_COSTS[action];

    return business.credits >= requiredCredits;
  }

  /**
   * Consume credits for an action
   */
  static async consumeCredits(
    businessId: string,
    action: CreditAction,
    userId: string,
    metadata?: Record<string, string>
  ) {
    const requiredCredits = CREDIT_COSTS[action];

    // Get current credits to check if sufficient
    const { data: business, error: fetchError } = await supabaseAdmin
      .from("businesses")
      .select("credits")
      .eq("id", businessId)
      .single();

    if (fetchError) {
      throw new Error(
        `Failed to fetch business credits: ${fetchError.message}`
      );
    }

    if (business.credits < requiredCredits) {
      throw new Error(
        `Insufficient credits. Current balance: ${business.credits}, Required: ${requiredCredits}`
      );
    }

    const newBalance = business.credits - requiredCredits;

    // Update business credits
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .update({ credits: newBalance })
      .eq("id", businessId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to consume credits: ${error.message}`);
    }

    // Log the transaction
    await supabaseAdmin.from("credit_transactions").insert({
      business_id: businessId,
      transaction_type: "usage",
      amount: -requiredCredits,
      balance_after: newBalance,
      description: `Used ${requiredCredits} credits for ${action}`,
      metadata: { action, userId, ...metadata },
    });

    // Log the usage
    await supabaseAdmin.from("credit_usage_logs").insert({
      business_id: businessId,
      action_type: action,
      credits_used: requiredCredits,
      feature_used: action,
      user_id: userId,
      ...metadata,
    });

    return data;
  }

  /**
   * Add credits to business account
   */
  static async addCredits({
    businessId,
    amount,
    transactionType,
    description,
    stripePaymentIntentId,
    metadata,
  }: {
    businessId: string;
    amount: number;
    transactionType: "purchase" | "bonus" | "monthly_allocation" | "refund";
    description?: string;
    stripePaymentIntentId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>;
  }) {
    // Get current credits
    const { data: business, error: fetchError } = await supabaseAdmin
      .from("businesses")
      .select("credits")
      .eq("id", businessId)
      .single();

    if (fetchError) {
      throw new Error(
        `Failed to fetch business credits: ${fetchError.message}`
      );
    }

    const newBalance = business.credits + amount;

    // Update business credits
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .update({ credits: newBalance })
      .eq("id", businessId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add credits: ${error.message}`);
    }

    // Log the transaction
    await supabaseAdmin.from("credit_transactions").insert({
      business_id: businessId,
      transaction_type: transactionType,
      amount: amount,
      balance_after: newBalance,
      description:
        description || `Added ${amount} credits via ${transactionType}`,
      metadata: metadata,
      stripe_payment_intent_id: stripePaymentIntentId,
    });

    return data;
  }

  /**
   * Get credit transaction history
   */
  static async getCreditHistory(
    businessId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const { data, error } = await supabaseAdmin
      .from("credit_transactions")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get credit history: ${error.message}`);
    }

    return data;
  }

  /**
   * Create Stripe checkout session for credit purchase
   */
  static async createCreditPurchaseSession(
    businessId: string,
    credits: number,
    successUrl: string,
    cancelUrl: string
  ) {
    // Get business to determine credit price based on subscription plan
    const business = await this.getBusinessCredits(businessId);
    const plan =
      SUBSCRIPTION_PLANS[business.subscription_plan as SubscriptionPlan] ||
      SUBSCRIPTION_PLANS.FREE;

    const amount = Math.round(credits * plan.creditPrice * 100); // Convert to cents

    // Get or create Stripe customer
    let stripeCustomerId = "";
    const { data: businessData } = await supabaseAdmin
      .from("businesses")
      .select("stripe_customer_id, name, email")
      .eq("id", businessId)
      .single();

    if (businessData?.stripe_customer_id) {
      stripeCustomerId = businessData.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        name: businessData?.name,
        email: businessData?.email,
        metadata: {
          business_id: businessId,
        },
      });

      stripeCustomerId = customer.id;

      // Update business with Stripe customer ID
      await supabaseAdmin
        .from("businesses")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", businessId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${credits} Credits`,
              description: `Purchase ${credits} credits for your account`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        business_id: businessId,
        credits: credits.toString(),
        credit_price: plan.creditPrice.toString(),
        transaction_type: "purchase",
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Create Stripe checkout session for subscription
   */
  static async createSubscriptionSession(
    businessId: string,
    subscriptionPlan: SubscriptionPlan,
    successUrl: string,
    cancelUrl: string
  ) {
    if (subscriptionPlan === "FREE") {
      throw new Error("Cannot create subscription session for free plan");
    }

    const plan = SUBSCRIPTION_PLANS[subscriptionPlan];
    if (!plan.stripePriceId) {
      throw new Error(
        `No Stripe price ID configured for ${subscriptionPlan} plan`
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = "";
    const { data: businessData } = await supabaseAdmin
      .from("businesses")
      .select("stripe_customer_id, name, email")
      .eq("id", businessId)
      .single();

    if (businessData?.stripe_customer_id) {
      stripeCustomerId = businessData.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        name: businessData?.name,
        email: businessData?.email,
        metadata: {
          business_id: businessId,
        },
      });

      stripeCustomerId = customer.id;

      await supabaseAdmin
        .from("businesses")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", businessId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        business_id: businessId,
        subscription_plan: subscriptionPlan,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Create Stripe billing portal session
   */
  static async createBillingPortalSession(
    businessId: string,
    returnUrl: string
  ) {
    // Get business Stripe customer ID
    const { data: businessData } = await supabaseAdmin
      .from("businesses")
      .select("stripe_customer_id")
      .eq("id", businessId)
      .single();

    if (!businessData?.stripe_customer_id) {
      throw new Error("No Stripe customer found for this business");
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: businessData.stripe_customer_id,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  }

  /**
   * Handle successful subscription creation/update
   */
  static async handleSubscriptionEvent(subscription: Stripe.Subscription) {
    const businessId = subscription.metadata?.business_id;
    if (!businessId) {
      throw new Error("No business_id in subscription metadata");
    }

    const subscriptionPlan = subscription.metadata
      ?.subscription_plan as SubscriptionPlan;
    if (!subscriptionPlan) {
      throw new Error("No subscription_plan in subscription metadata");
    }

    const currentPeriodEnd = subscription.items.data[0].current_period_end;

    const plan = SUBSCRIPTION_PLANS[subscriptionPlan];
    const expiresAt = new Date(currentPeriodEnd * 1000);

    // Update business subscription
    await supabaseAdmin
      .from("businesses")
      .update({
        subscription_plan: subscriptionPlan,
        subscription_status: subscription.status,
        subscription_started_at: new Date(
          subscription.created * 1000
        ).toISOString(),
        subscription_expires_at: expiresAt.toISOString(),
        stripe_subscription_id: subscription.id,
      })
      .eq("id", businessId);

    // Add monthly credits
    await this.addCredits({
      businessId,
      amount: plan.monthlyCredits,
      transactionType: "monthly_allocation",
      description: `Monthly credit allocation for ${plan.name} plan`,
      metadata: { subscription_id: subscription.id, plan: subscriptionPlan },
    });

    // Log subscription change
    await supabaseAdmin.from("subscription_history").insert({
      business_id: businessId,
      new_plan: subscriptionPlan,
      change_reason: "subscription_created",
      stripe_subscription_id: subscription.id,
    });
  }

  /**
   * Handle successful payment for credit purchase
   */
  static async handlePaymentEvent(paymentIntent: Stripe.PaymentIntent) {
    const businessId = paymentIntent.metadata?.business_id;
    const credits = parseInt(paymentIntent.metadata?.credits || "0");

    if (!businessId || !credits) {
      throw new Error("Invalid payment metadata");
    }

    await this.addCredits({
      businessId,
      amount: credits,
      transactionType: "purchase",
      description: `Purchased ${credits} credits`,
      stripePaymentIntentId: paymentIntent.id,
      metadata: {
        amount_paid: paymentIntent.amount.toString(),
        currency: paymentIntent.currency,
      },
    });
  }

  /**
   * Get credit usage analytics
   */
  static async getCreditAnalytics(businessId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from("credit_usage_logs")
      .select("action_type, credits_used, created_at")
      .eq("business_id", businessId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to get credit analytics: ${error.message}`);
    }

    // Group by action type and day
    const analytics = data.reduce((acc, log) => {
      const date = new Date(log.created_at).toDateString();
      if (!acc[date]) {
        acc[date] = {};
      }
      if (!acc[date][log.action_type]) {
        acc[date][log.action_type] = 0;
      }
      acc[date][log.action_type] += log.credits_used;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return analytics;
  }
}
