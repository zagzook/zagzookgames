// =============================================================
// UPGRADE SUCCESS PAGE — /upgrade/success
// Shown after a successful Stripe checkout.
// The subscription state is updated by the Stripe webhook —
// we just show a confirmation and redirect to dashboard.
// =============================================================

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UpgradeSuccessPage() {
  return (
    <div className="max-w-md mx-auto">
      <Card className="text-center border-green-200 bg-green-50/30">
        <CardHeader>
          <div className="text-5xl mb-2">🎉</div>
          <CardTitle className="text-2xl">Welcome to Pro!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your subscription is being activated. It may take a few seconds
            to reflect across the site — refresh your dashboard if your plan
            still shows as Free.
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
