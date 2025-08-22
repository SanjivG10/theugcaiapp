import { Request, Response } from "express";
import Stripe from "stripe";
import { CreditService } from "../services/creditService";
import { env } from "../config/env";
import { supabaseAdmin } from "../config/supabase";
import { SUBSCRIPTION_PLANS } from "../config/credits";
import { ApiResponse, SubscriptionHistory } from "../types/database";

const stripe = new Stripe(env.STRIPE.SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

const webhookSecret = env.STRIPE.WEBHOOK_SECRET;

export class WebhookController {
  /**
   * Handle Stripe webhook events
   */
  static async handleStripeWebhook(req: Request, res: Response) {
    const signature = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return res.status(400).json({
        success: false,
        message: "Webhook signature verification failed",
      });
    }

    console.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          await WebhookController.handlePaymentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case "customer.subscription.created":
        case "customer.subscription.updated":
          await WebhookController.handleSubscriptionChange(
            event.data.object as Stripe.Subscription
          );
          break;

        case "customer.subscription.deleted":
          await WebhookController.handleSubscriptionCancelled(
            event.data.object as Stripe.Subscription
          );
          break;

        case "invoice.payment_succeeded":
          await WebhookController.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice
          );
          break;

        case "invoice.payment_failed":
          await WebhookController.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice
          );
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      const response: ApiResponse<{ received: boolean }> = {
        success: true,
        data: { received: true },
      };

      res.json(response);
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({
        success: false,
        message: "Error processing webhook",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Handle successful payment (credit purchase)
   */
  private static async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ) {
    console.log("Processing payment succeeded:", paymentIntent.id);

    // Check if this is a credit purchase (has credits in metadata)
    if (paymentIntent.metadata?.credits) {
      await CreditService.handlePaymentEvent(paymentIntent);
      console.log(`Credits added for payment: ${paymentIntent.id}`);
    }
  }

  /**
   * Handle subscription creation/update
   */
  private static async handleSubscriptionChange(
    subscription: Stripe.Subscription
  ) {
    console.log("Processing subscription change:", subscription.id);

    if (subscription.status === "active") {
      await CreditService.handleSubscriptionEvent(subscription);
      console.log(`Subscription processed: ${subscription.id}`);
    }
  }

  /**
   * Handle subscription cancellation
   */
  private static async handleSubscriptionCancelled(
    subscription: Stripe.Subscription
  ) {
    console.log("Processing subscription cancellation:", subscription.id);

    const businessId = subscription.metadata?.business_id;
    if (!businessId) {
      console.error("No business_id in subscription metadata");
      return;
    }

    // Update business to free plan
    await supabaseAdmin
      .from("businesses")
      .update({
        subscription_plan: "free",
        subscription_status: "cancelled",
        subscription_expires_at: new Date(
          subscription.ended_at! * 1000
        ).toISOString(),
      })
      .eq("id", businessId);

    // Log subscription change
    await supabaseAdmin.from("subscription_history").insert({
      business_id: businessId,
      old_plan: subscription.metadata?.subscription_plan,
      new_plan: "free",
      change_reason: "subscription_cancelled",
      stripe_subscription_id: subscription.id,
    });

    console.log(`Subscription cancelled for business: ${businessId}`);
  }

  /**
   * Handle successful recurring payment (monthly subscription)
   */
  private static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log("Processing invoice payment succeeded:", invoice.id);

    if (
      "subscription" in invoice &&
      invoice.billing_reason === "subscription_cycle"
    ) {
      // This is a recurring subscription payment - add monthly credits
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription as string
      );
      const businessId = subscription.metadata?.business_id;
      const subscriptionPlan = subscription.metadata?.subscription_plan;

      if (businessId && subscriptionPlan) {
        const plan =
          SUBSCRIPTION_PLANS[
            subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS
          ];

        if (plan) {
          await CreditService.addCredits({
            businessId,
            amount: plan.monthlyCredits,
            transactionType: "monthly_allocation",
            description: `Monthly credit allocation for ${
              plan.name
            } plan - ${new Date().toLocaleDateString()}`,
            metadata: {
              subscription_id: subscription.id,
              invoice_id: invoice.id ?? "",
              plan: subscriptionPlan,
            },
          });

          console.log(`Monthly credits allocated for business: ${businessId}`);
        }
      }
    }
  }

  /**
   * Handle failed payment
   */
  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    console.log("Processing invoice payment failed:", invoice.id);

    if ("subscription" in invoice && invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription as string
      );
      const businessId = subscription.metadata?.business_id;

      if (businessId) {
        await supabaseAdmin
          .from("businesses")
          .update({
            subscription_status: "past_due",
          })
          .eq("id", businessId);

        console.log(
          `Subscription marked as past_due for business: ${businessId}`
        );
      }
    }
  }
}
