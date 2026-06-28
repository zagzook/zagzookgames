// =============================================================
// STRIPE WEBHOOK HANDLER
// Stripe calls this endpoint whenever a subscription event fires.
// This is how our database stays in sync with Stripe's billing state.
//
// Events we handle:
//   - checkout.session.completed    → user just subscribed
//   - customer.subscription.updated → plan changed, renewed, etc.
//   - customer.subscription.deleted → subscription canceled
//
// SECURITY: Every request is verified using the webhook signature.
// If the signature check fails we return 400 — never process
// unverified webhook payloads.
// =============================================================

import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { syncStripeSubscriptionToDb } from "@/lib/stripe-helpers"
import Stripe from "stripe"

// Tell Next.js NOT to parse the body — we need the raw bytes
// to verify the Stripe webhook signature
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  // Read the raw request body as text (required for signature verification)
  const body = await req.text()

  // Stripe sends this header with every webhook request
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  // Verify the webhook came from Stripe (not a spoofed request)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Route the event to the appropriate handler
  try {
    switch (event.type) {
      // --------------------------------------------------------
      // User completed checkout — they are now a Pro subscriber
      // --------------------------------------------------------
      case "checkout.session.completed": {
        // Stripe SDK v17+: CheckoutSession is nested under Stripe.Checkout.Session
        const session = event.data.object as Stripe.Checkout.Session

        // Only handle subscription checkouts (not one-time payments)
        if (session.mode !== "subscription") break

        const subscriptionId = session.subscription as string
        if (subscriptionId) {
          await syncStripeSubscriptionToDb(subscriptionId)
        }
        break
      }

      // --------------------------------------------------------
      // Subscription was updated — renewal, plan change, etc.
      // --------------------------------------------------------
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await syncStripeSubscriptionToDb(subscription.id)
        break
      }

      // --------------------------------------------------------
      // Subscription was canceled or expired
      // We sync the state which will set tier back to FREE
      // --------------------------------------------------------
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await syncStripeSubscriptionToDb(subscription.id)
        break
      }

      default:
        // Log unhandled events but don't error — Stripe expects 200
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    // Always return 200 to Stripe so it knows we received the event
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Error processing Stripe webhook:", err)
    // Return 500 so Stripe will retry the webhook
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
