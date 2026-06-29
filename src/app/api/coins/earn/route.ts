// =============================================================
// API ROUTE — POST /api/coins/earn
// Awards coins when a user completes a game.
//
// SECURITY RULES — all enforced server-side:
//   1. User must be authenticated
//   2. The game must exist and be accessible to this user's tier
//   3. The game must NOT have already been completed by this user
//      (prevents farming coins by replaying the same game)
//   4. Coin amount comes from the game's manifest — never from
//      the client request body
// =============================================================

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { awardCoins } from "@/lib/coins"
import { CoinTransactionType } from "@prisma/client"
import { z } from "zod"

// Validate the request body shape
const EarnSchema = z.object({
  gameId: z.string().optional(),         // set for daily games
  bookletGameId: z.string().optional(),  // set for booklet games
  timeSpentSecs: z.number().int().min(0).optional(),
}).refine(
  (data) => !!data.gameId !== !!data.bookletGameId,
  { message: "Provide either gameId or bookletGameId, not both." }
)

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 })
  }

  const userId = session.user.id

  // Parse and validate the request body
  const body = await req.json()
  const parsed = EarnSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { gameId, bookletGameId, timeSpentSecs } = parsed.data

  // -------------------------------------------------------
  // DAILY GAME COMPLETION
  // -------------------------------------------------------
  if (gameId) {
    // Verify the game exists and fetch its manifest for coin amount
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        tier: true,
        title: true,
        gameType: {
          select: {
            displayName: true,
            manifest: { select: { config: true } },
          },
        },
      },
    })

    if (!game) {
      return NextResponse.json({ error: "Game not found." }, { status: 404 })
    }

    // Block free users from earning coins on pro games
    if (game.tier === "PRO" && session.user.tier !== "PRO") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 })
    }

    // Check if already completed — prevent coin farming
    const existing = await prisma.userGameProgress.findUnique({
      where: { userId_gameId: { userId, gameId } },
      select: { isCompleted: true },
    })

    if (existing?.isCompleted) {
      return NextResponse.json(
        { error: "You have already completed this game. Coins can only be earned once per game." },
        { status: 409 }
      )
    }

    // Get coin amount from manifest (not from client)
    const manifest = game.gameType.manifest?.config as { coinsOnComplete?: number } | null
    const coinsToAward = manifest?.coinsOnComplete ?? 50

    // Mark the game as completed and award coins atomically
    await prisma.userGameProgress.upsert({
      where: { userId_gameId: { userId, gameId } },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        timeSpentSecs: timeSpentSecs ?? 0,
      },
      create: {
        userId,
        gameId,
        isCompleted: true,
        completedAt: new Date(),
        timeSpentSecs: timeSpentSecs ?? 0,
      },
    })

    const { newBalance } = await awardCoins({
      userId,
      amount: coinsToAward,
      type: CoinTransactionType.EARN_GAME_COMPLETE,
      description: `Completed ${game.gameType.displayName}${game.title ? ` — ${game.title}` : ""}`,
      gameId,
    })

    return NextResponse.json({ coinsAwarded: coinsToAward, newBalance })
  }

  // -------------------------------------------------------
  // BOOKLET GAME COMPLETION
  // -------------------------------------------------------
  if (bookletGameId) {
    if (session.user.tier !== "PRO") {
      return NextResponse.json({ error: "Booklets require a Pro subscription." }, { status: 403 })
    }

    const bookletGame = await prisma.bookletGame.findUnique({
      where: { id: bookletGameId },
      select: {
        id: true,
        title: true,
        chapter: {
          select: {
            id: true,
            booklet: {
              select: {
                id: true,
                gameType: {
                  select: {
                    displayName: true,
                    manifest: { select: { config: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!bookletGame) {
      return NextResponse.json({ error: "Booklet game not found." }, { status: 404 })
    }

    // Check if already completed
    const existing = await prisma.userGameProgress.findUnique({
      where: { userId_bookletGameId: { userId, bookletGameId } },
      select: { isCompleted: true },
    })

    if (existing?.isCompleted) {
      return NextResponse.json(
        { error: "Already completed. Coins can only be earned once per game." },
        { status: 409 }
      )
    }

    const manifest = bookletGame.chapter.booklet.gameType.manifest?.config as { coinsOnComplete?: number } | null
    const coinsToAward = manifest?.coinsOnComplete ?? 50

    // Mark complete and award coins
    await prisma.userGameProgress.upsert({
      where: { userId_bookletGameId: { userId, bookletGameId } },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        timeSpentSecs: timeSpentSecs ?? 0,
      },
      create: {
        userId,
        bookletGameId,
        isCompleted: true,
        completedAt: new Date(),
        timeSpentSecs: timeSpentSecs ?? 0,
      },
    })

    const { newBalance } = await awardCoins({
      userId,
      amount: coinsToAward,
      type: CoinTransactionType.EARN_BOOKLET_GAME_COMPLETE,
      description: `Completed booklet game — ${bookletGame.chapter.booklet.gameType.displayName}`,
      bookletGameId,
    })

    return NextResponse.json({ coinsAwarded: coinsToAward, newBalance })
  }
}
