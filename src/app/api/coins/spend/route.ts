// =============================================================
// API ROUTE — POST /api/coins/spend
// Deducts coins when a user purchases a hint.
//
// SECURITY RULES — all enforced server-side:
//   1. User must be authenticated
//   2. Hint type must exist in the game's manifest
//   3. Coin cost comes from the manifest — never from the client
//   4. User must have enough coins (never goes negative)
//   5. maxHintsPerGame limit is enforced if set in manifest
// =============================================================

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { spendCoins } from "@/lib/coins"
import { z } from "zod"
import type { GameManifestConfig } from "@/lib/game-registry/types"

// Validate the request body
const SpendSchema = z.object({
  hintType: z.string(),                  // e.g. "reveal_cell"
  gameId: z.string().optional(),         // for daily games
  bookletGameId: z.string().optional(),  // for booklet games
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

  const body = await req.json()
  const parsed = SpendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { hintType, gameId, bookletGameId } = parsed.data

  // -------------------------------------------------------
  // LOOK UP THE MANIFEST to get the hint cost
  // The client tells us WHICH hint type, not how much it costs.
  // We look up the cost from the server-side manifest.
  // -------------------------------------------------------
  let manifest: GameManifestConfig | null = null
  let gameTitle = ""
  let hintsUsedSoFar = 0

  if (gameId) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        title: true,
        tier: true,
        gameType: { select: { manifest: { select: { config: true } } } },
      },
    })

    if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 })
    if (game.tier === "PRO" && session.user.tier !== "PRO") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 })
    }

    manifest = game.gameType.manifest?.config as GameManifestConfig
    gameTitle = game.title ?? ""

    // Check current hint usage for this game
    const progress = await prisma.userGameProgress.findUnique({
      where: { userId_gameId: { userId, gameId } },
      select: { hintsUsed: true },
    })
    hintsUsedSoFar = progress?.hintsUsed ?? 0
  }

  if (bookletGameId) {
    if (session.user.tier !== "PRO") {
      return NextResponse.json({ error: "Booklets require Pro." }, { status: 403 })
    }

    const bookletGame = await prisma.bookletGame.findUnique({
      where: { id: bookletGameId },
      select: {
        title: true,
        chapter: {
          select: {
            booklet: {
              select: {
                gameType: { select: { manifest: { select: { config: true } } } },
              },
            },
          },
        },
      },
    })

    if (!bookletGame) return NextResponse.json({ error: "Game not found." }, { status: 404 })

    manifest = bookletGame.chapter.booklet.gameType.manifest?.config as GameManifestConfig
    gameTitle = bookletGame.title ?? ""

    const progress = await prisma.userGameProgress.findUnique({
      where: { userId_bookletGameId: { userId, bookletGameId } },
      select: { hintsUsed: true },
    })
    hintsUsedSoFar = progress?.hintsUsed ?? 0
  }

  if (!manifest) {
    return NextResponse.json({ error: "Game manifest not found." }, { status: 500 })
  }

  // -------------------------------------------------------
  // ENFORCE maxHintsPerGame limit
  // -------------------------------------------------------
  if (manifest.maxHintsPerGame !== undefined && hintsUsedSoFar >= manifest.maxHintsPerGame) {
    return NextResponse.json(
      { error: `Hint limit reached. Maximum ${manifest.maxHintsPerGame} hints allowed per game.` },
      { status: 409 }
    )
  }

  // -------------------------------------------------------
  // FIND THE HINT TYPE IN THE MANIFEST
  // -------------------------------------------------------
  const hintDef = manifest.hints.find((h) => h.type === hintType)
  if (!hintDef) {
    return NextResponse.json(
      { error: `Unknown hint type: ${hintType}` },
      { status: 400 }
    )
  }

  // -------------------------------------------------------
  // SPEND THE COINS
  // The cost comes from the manifest — client has no say in the price
  // -------------------------------------------------------
  const result = await spendCoins({
    userId,
    amount: hintDef.coinCost,
    description: `Hint: ${hintDef.label}${gameTitle ? ` — ${gameTitle}` : ""}`,
    gameId,
    bookletGameId,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 402 }) // 402 Payment Required
  }

  // Increment the hint usage counter on the progress record
  if (gameId) {
    await prisma.userGameProgress.upsert({
      where: { userId_gameId: { userId, gameId } },
      update: { hintsUsed: { increment: 1 } },
      create: { userId, gameId, hintsUsed: 1 },
    })
  }

  if (bookletGameId) {
    await prisma.userGameProgress.upsert({
      where: { userId_bookletGameId: { userId, bookletGameId } },
      update: { hintsUsed: { increment: 1 } },
      create: { userId, bookletGameId, hintsUsed: 1 },
    })
  }

  return NextResponse.json({
    success: true,
    coinsSpent: hintDef.coinCost,
    newBalance: result.newBalance,
    hint: {
      type: hintDef.type,
      label: hintDef.label,
    },
  })
}
