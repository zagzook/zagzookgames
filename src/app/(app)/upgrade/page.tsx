// =============================================================
// UPGRADE PAGE — /upgrade
// Shows Pro plan benefits and triggers Stripe Checkout.
// =============================================================

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Pro plan feature list shown on the upgrade page
const PRO_FEATURES = [
  { icon: "🎮", text: "All daily games including Pro-exclusive titles" },
  { icon: "📅", text: "Access up to 1 year of past daily games" },
  { icon: "📖", text: "Full library of game booklets (100 puzzles each)" },
  { icon: "📚", text: "New booklets added every month" },
  { icon: "🪙", text: "Earn coins on every game — spend on hints" },
  { icon: "⭐", text: "Priority access to new game types" },
]

export default function UpgradePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleUpgrade() {
    setIsLoading(true)
    setError("")

    // Ask server to create a Stripe Checkout session
    const res = await fetch("/api/stripe/checkout", { method: "POST" })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.")
      setIsLoading(false)
      return
    }

    // Redirect to Stripe's hosted checkout page
    router.push(data.url)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold">Upgrade to Pro</h1>
        <p className="text-muted-foreground mt-2">
          Unlock everything Zagzook Games has to offer
        </p>
      </div>

      {/* Pricing Card */}
      <Card className="border-yellow-300 bg-yellow-50/30">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">Zagzook Pro</CardTitle>
          <CardDescription>
            <span className="text-4xl font-bold text-foreground">$9.99</span>
            <span className="text-muted-foreground"> / month</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Feature List */}
          <ul className="space-y-3">
            {PRO_FEATURES.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-xl leading-tight">{feature.icon}</span>
                <span className="text-sm leading-relaxed">{feature.text}</span>
              </li>
            ))}
          </ul>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* CTA Button */}
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-base py-6"
          >
            {isLoading ? "Redirecting to checkout…" : "Upgrade to Pro →"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secured by Stripe. Cancel anytime from your profile.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
