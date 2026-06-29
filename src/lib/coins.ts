// =============================================================
// COIN LEDGER — Core Functions
// All coin operations go through these functions.
// NEVER update coin balances directly — always use these helpers
// so every transaction is logged in the coin_ledger table.
//
// Balance is derived from the ledger (SUM of all amounts) and
// cached in balanceAfter on each row for fast lookups.
// =============================================================

import { prisma } from "@/lib/prisma"
import { CoinTransactionType, Prisma } from "@prisma/client"

// -------------------------------------------------------------
// getUserCoinBalance
// Returns the current coin balance for a user.
// Reads the most recent ledger row's balanceAfter field —
// O(1) lookup rather than summing the entire ledger.
// -------------------------------------------------------------
export async function getUserCoinBalance(userId: string): Promise<number> {
  const latest = await prisma.coinLedger.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { balanceAfter: true },
  })
  // No transactions yet = zero balance
  return latest?.balanceAfter ?? 0
}

// -------------------------------------------------------------
// awardCoins
// Adds coins to a user's balance and records the transaction.
// Called server-side only — never from client code.
//
// Uses a Prisma transaction to ensure the balance calculation
// and ledger write are atomic (no race condition between two
// concurrent completions).
// -------------------------------------------------------------
export async function awardCoins({
  userId,
  amount,
  type,
  description,
  gameId,
  bookletGameId,
}: {
  userId: string
  amount: number
  type: CoinTransactionType
  description: string
  gameId?: string
  bookletGameId?: string
}): Promise<{ newBalance: number }> {
  if (amount <= 0) {
    throw new Error("Award amount must be positive")
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Get current balance inside the transaction for accuracy
    const latest = await tx.coinLedger.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { balanceAfter: true },
    })

    const currentBalance = latest?.balanceAfter ?? 0
    const newBalance = currentBalance + amount

    // Write the ledger entry
    await tx.coinLedger.create({
      data: {
        userId,
        type,
        amount,                // positive = earn
        balanceAfter: newBalance,
        description,
        gameId: gameId ?? null,
        bookletGameId: bookletGameId ?? null,
      },
    })

    return { newBalance }
  })

  return result
}

// -------------------------------------------------------------
// spendCoins
// Deducts coins from a user's balance for a hint purchase.
// Returns { success: false } if the user cannot afford it —
// never goes negative.
// -------------------------------------------------------------
export async function spendCoins({
  userId,
  amount,
  description,
  gameId,
  bookletGameId,
}: {
  userId: string
  amount: number
  description: string
  gameId?: string
  bookletGameId?: string
}): Promise<{ success: boolean; newBalance: number; error?: string }> {
  if (amount <= 0) {
    throw new Error("Spend amount must be positive")
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Get current balance inside the transaction
    const latest = await tx.coinLedger.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { balanceAfter: true },
    })

    const currentBalance = latest?.balanceAfter ?? 0

    // Reject if the user can't afford it
    if (currentBalance < amount) {
      return {
        success: false,
        newBalance: currentBalance,
        error: `Insufficient coins. You have ${currentBalance} but need ${amount}.`,
      }
    }

    const newBalance = currentBalance - amount

    // Write the ledger entry (negative amount = spend)
    await tx.coinLedger.create({
      data: {
        userId,
        type: CoinTransactionType.SPEND_HINT,
        amount: -amount,        // negative = spend
        balanceAfter: newBalance,
        description,
        gameId: gameId ?? null,
        bookletGameId: bookletGameId ?? null,
      },
    })

    return { success: true, newBalance }
  })

  return result
}
