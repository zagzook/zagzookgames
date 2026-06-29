// =============================================================
// API ROUTE — GET /api/coins
// Returns the authenticated user's current coin balance
// and their 20 most recent transactions.
// =============================================================

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getUserCoinBalance } from "@/lib/coins"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 })
  }

  const userId = session.user.id

  // Get current balance and recent transaction history in parallel
  const [balance, transactions] = await Promise.all([
    getUserCoinBalance(userId),
    prisma.coinLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20, // last 20 transactions for the UI history panel
      select: {
        id: true,
        type: true,
        amount: true,
        balanceAfter: true,
        description: true,
        createdAt: true,
      },
    }),
  ])

  return NextResponse.json({ balance, transactions })
}
