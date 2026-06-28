// =============================================================
// STRIPE CLIENT SINGLETON
// Same pattern as the Prisma singleton — one instance reused
// across hot-reloads in development.
// Only import this file in SERVER-side code (API routes, server
// components). Never import it in client components.
// =============================================================

import Stripe from "stripe"

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined
}

export const stripe =
  globalForStripe.stripe ??
  new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // Pin the API version so Stripe updates never silently break our code
    apiVersion: "2026-06-24.dahlia",
    // Identify our app in Stripe logs
    appInfo: {
      name: "Zagzook Games",
      url: "https://zagzookgames.com",
    },
  })

if (process.env.NODE_ENV !== "production") {
  globalForStripe.stripe = stripe
}
