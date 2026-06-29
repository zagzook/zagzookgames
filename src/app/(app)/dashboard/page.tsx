// =============================================================
// DASHBOARD PAGE — /dashboard
// The main landing page after login.
// Shows today's game status, coin balance, and quick links.
// =============================================================

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getUserCoinBalance } from "@/lib/coins"
import { startOfDay, endOfDay } from "@/lib/date-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id
  const today = new Date()

  // Fetch data in parallel
  const [coinBalance, todayGamesCount, completedTodayCount, recentBooklets] = await Promise.all([
    // Current coin balance
    getUserCoinBalance(userId),

    // How many games are scheduled for today
    prisma.game.count({
      where: {
        scheduledDate: { gte: startOfDay(today), lte: endOfDay(today) },
        isPublished: true,
        // Free users only see free games in their count
        ...(session.user.tier === "FREE" && { tier: "FREE" }),
      },
    }),

    // How many the user has completed today
    prisma.userGameProgress.count({
      where: {
        userId,
        isCompleted: true,
        game: {
          scheduledDate: { gte: startOfDay(today), lte: endOfDay(today) },
        },
      },
    }),

    // Latest booklets (Pro only)
    session.user.tier === "PRO"
      ? prisma.booklet.findMany({
          where: { isPublished: true },
          orderBy: { publishedAt: "desc" },
          take: 3,
          select: {
            id: true,
            title: true,
            gameType: { select: { displayName: true } },
          },
        })
      : Promise.resolve([]),
  ])

  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {session.user.name?.split(" ")[0] ?? "Puzzler"}!
        </h1>
        <p className="text-muted-foreground mt-1">{todayFormatted}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today&apos;s Games</CardDescription>
            <CardTitle className="text-3xl">
              {completedTodayCount}
              <span className="text-lg text-muted-foreground font-normal">
                /{todayGamesCount}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">completed today</p>
          </CardContent>
        </Card>

        {/* Coin Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Coin Balance</CardDescription>
            <CardTitle className="text-3xl">
              🪙 {coinBalance.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">use coins for hints</p>
          </CardContent>
        </Card>

        {/* Subscription Tier */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Your Plan</CardDescription>
            <CardTitle className="text-3xl">
              {session.user.tier === "PRO" ? "⭐ Pro" : "Free"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {session.user.tier === "PRO" ? (
              <p className="text-sm text-muted-foreground">full access unlocked</p>
            ) : (
              <Link href="/upgrade" className="text-sm text-primary hover:underline">
                Upgrade to Pro →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Daily Games */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle>Daily Games</CardTitle>
            <CardDescription>
              {todayGamesCount > 0
                ? `${todayGamesCount} puzzle${todayGamesCount !== 1 ? "s" : ""} waiting for you today`
                : "No games scheduled yet for today"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/play">Play Today&apos;s Games</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Booklets or Upgrade */}
        {session.user.tier === "PRO" ? (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle>Game Booklets</CardTitle>
              <CardDescription>
                {recentBooklets.length > 0
                  ? `${recentBooklets.length} recent booklet${recentBooklets.length !== 1 ? "s" : ""} available`
                  : "Booklets coming soon"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/booklets">Browse Booklets</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-yellow-200 bg-yellow-50/50 hover:border-yellow-400 transition-colors">
            <CardHeader>
              <CardTitle>Go Pro</CardTitle>
              <CardDescription>
                Unlock Pro games, booklets, and one year of daily game history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                <Link href="/upgrade">Upgrade to Pro</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
