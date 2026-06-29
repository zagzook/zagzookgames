// =============================================================
// API ROUTE — POST /api/stripe/checkout
// Creates a Stripe Checkout session for the Pro plan and
// returns the redirect URL. The client navigates to that URL.
// =============================================================

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createCheckoutSession } from "@/lib/stripe-helpers"

export async function POST() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 })
  }

  // Already Pro — no need to checkout again
  if (session.user.tier === "PRO") {
    return NextResponse.json({ error: "You are already a Pro member." }, { status: 409 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const checkoutUrl = await createCheckoutSession(
    session.user.id,
    `${baseUrl}/upgrade/success`, // redirect here on successful payment
    `${baseUrl}/upgrade`          // redirect here if user cancels
  )

  return NextResponse.json({ url: checkoutUrl })
}
