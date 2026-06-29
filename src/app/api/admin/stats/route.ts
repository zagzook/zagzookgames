// =============================================================
// ADMIN API — GET /api/admin/stats
// Returns site-wide stats for the admin dashboard.
// =============================================================

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  // Run all stat queries in parallel for speed
  const [
    totalUsers,
    proUsers,
    totalGames,
    totalBooklets,
    totalCoinTransactions,
    recentSignups,
  ] = await Promise.all([
    // Total registered users
    prisma.user.count(),

    // Active Pro subscribers
    prisma.subscription.count({
      where: { tier: "PRO", status: "ACTIVE" },
    }),

    // Total published daily games in the DB
    prisma.game.count({ where: { isPublished: true } }),

    // Total published booklets
    prisma.booklet.count({ where: { isPublished: true } }),

    // Total coin transactions (earn + spend)
    prisma.coinLedger.count(),

    // New users in the last 30 days
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  return NextResponse.json({
    totalUsers,
    proUsers,
    freeUsers: totalUsers - proUsers,
    totalGames,
    totalBooklets,
    totalCoinTransactions,
    recentSignups,
  })
}
