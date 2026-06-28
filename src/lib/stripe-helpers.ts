// =============================================================
// STRIPE HELPER FUNCTIONS
// Server-side utilities for creating/managing subscriptions.
// All functions here are async and must only run on the server.
// =============================================================

import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

// -------------------------------------------------------------
// getOrCreateStripeCustomer
// Every Zagzook user needs a Stripe customer record before they
// can subscribe. This creates one if it doesn't exist yet, or
// returns the existing customer ID.
// -------------------------------------------------------------
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  // Check if we already have a Stripe customer ID for this user
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  })

  if (subscription?.stripeCustomerId) {
    // Already exists — return it
    return subscription.stripeCustomerId
  }

  // Fetch the user's name and email to attach to the Stripe record
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  })

  if (!user?.email) {
    throw new Error(`User ${userId} not found or has no email`)
  }

  // Create the Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: {
      // Store our internal userId on the Stripe customer so webhook
      // handlers can look up the right user without an extra DB query
      zagzookUserId: userId,
    },
  })

  // Persist the Stripe customer ID in our database
  await prisma.subscription.update({
    where: { userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

// -------------------------------------------------------------
// createCheckoutSession
// Creates a Stripe Checkout session for the Pro plan.
// The user is redirected to Stripe's hosted checkout page,
// then redirected back to successUrl or cancelUrl.
// -------------------------------------------------------------
export async function createCheckoutSession(
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID!,
        quantity: 1,
      },
    ],
    // Allow users to manage their subscription after checkout
    customer_update: {
      address: "auto",
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      // Pass userId through checkout so webhook can update the DB
      zagzookUserId: userId,
    },
  })

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL")
  }

  return session.url
}

// -------------------------------------------------------------
// createBillingPortalSession
// Lets Pro users manage their subscription (cancel, update card)
// via Stripe's hosted billing portal. No custom UI needed.
// -------------------------------------------------------------
export async function createBillingPortalSession(
  userId: string,
  returnUrl: string
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId)

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}

// -------------------------------------------------------------
// syncStripeSubscriptionToDb
// Called by the webhook handler whenever a subscription event
// fires. Reads the latest subscription state from Stripe and
// writes it to our database.
// This is the single source of truth — we never update tier
// directly, only through this function via webhook.
// -------------------------------------------------------------
export async function syncStripeSubscriptionToDb(
  stripeSubscriptionId: string
): Promise<void> {
  // Fetch the full subscription object from Stripe
  // Cast to `any` for period fields: Stripe's newer API versions move
  // current_period_start/end off the root subscription type in TypeScript
  // but they are still present in the API response at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ["items.data.price"],
  }) as any

  // Extract the Stripe customer ID to find our user
  const stripeCustomerId =
    typeof stripeSub.customer === "string"
      ? stripeSub.customer
      : stripeSub.customer.id

  // Look up which user owns this Stripe customer
  const subscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId },
  })

  if (!subscription) {
    console.error(`No subscription found for Stripe customer ${stripeCustomerId}`)
    return
  }

  // Map Stripe subscription status to our enum
  const statusMap: Record<string, "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE"> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE",
    unpaid: "PAST_DUE",
    paused: "PAST_DUE",
  }

  const status = statusMap[stripeSub.status] ?? "INCOMPLETE"

  // Determine tier: ACTIVE or TRIALING = PRO, everything else = FREE
  const tier = status === "ACTIVE" || status === "TRIALING" ? "PRO" : "FREE"

  // Get the current price ID from the subscription items
  const priceId = stripeSub.items.data[0]?.price?.id ?? null

  // Write the updated state to our database
  await prisma.subscription.update({
    where: { stripeCustomerId },
    data: {
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: priceId,
      tier,
      status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  })
}
