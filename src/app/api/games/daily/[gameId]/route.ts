// =============================================================
// API ROUTE — GET /api/games/daily/[gameId]
// Returns the full puzzle content (gameData) for a single game.
//
// This is the gated endpoint. It only returns gameData after:
//   1. The user is authenticated
//   2. The user's subscription tier permits access to this game
//   3. The game's scheduled date is accessible to this user
//
// A FREE user requesting a PRO game receives a 403 + upsell flag.
// Game content is NEVER sent to unauthorized users.
// =============================================================

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params

  // Require authentication — no game content for anonymous users
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be logged in to play.", upsell: false },
      { status: 401 }
    )
  }

  const userTier = session.user.tier
  const userId = session.user.id

  // Fetch the game record (including its scheduled date and tier)
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      tier: true,
      level: true,
      title: true,
      scheduledDate: true,
      isPublished: true,
      gameData: true,        // ← puzzle content, returned only if authorized
      gameType: {
        select: {
          slug: true,
          displayName: true,
          component: true,
          manifest: {
            select: { config: true, version: true },
          },
        },
      },
    },
  })

  // Game not found or unpublished
  if (!game || !game.isPublished) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 })
  }

  // -------------------------------------------------------
  // DATE ACCESS CHECK
  // Free users: today only
  // Pro users: up to 1 year back
  // -------------------------------------------------------
  const today = new Date()
  const gameDate = new Date(game.scheduledDate)
  const oneYearAgo = new Date(today)
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const isToday = gameDate.toDateString() === today.toDateString()
  const isPastDate = gameDate < today && !isToday

  if (isPastDate && userTier !== "PRO") {
    return NextResponse.json(
      { error: "Access to past games requires a Pro subscription.", upsell: true },
      { status: 403 }
    )
  }

  if (isPastDate && userTier === "PRO" && gameDate < oneYearAgo) {
    return NextResponse.json(
      { error: "Archive access is limited to the past 12 months." },
      { status: 403 }
    )
  }

  // -------------------------------------------------------
  // TIER ACCESS CHECK
  // Pro games require a Pro subscription
  // -------------------------------------------------------
  if (game.tier === "PRO" && userTier !== "PRO") {
    return NextResponse.json(
      { error: "This game requires a Pro subscription.", upsell: true },
      { status: 403 }
    )
  }

  // -------------------------------------------------------
  // CREATE OR FETCH PROGRESS RECORD
  // Creates a "started" record so we can track time spent
  // -------------------------------------------------------
  const progress = await prisma.userGameProgress.upsert({
    where: {
      userId_gameId: { userId, gameId },
    },
    update: {}, // already exists — don't overwrite completion state
    create: {
      userId,
      gameId,
      isCompleted: false,
    },
    select: {
      isCompleted: true,
      hintsUsed: true,
      timeSpentSecs: true,
    },
  })

  // Return the full game content — user is authorized
  return NextResponse.json({
    id: game.id,
    gameTypeSlug: game.gameType.slug,
    gameTypeDisplayName: game.gameType.displayName,
    component: game.gameType.component,
    tier: game.tier,
    level: game.level,
    title: game.title,
    scheduledDate: game.scheduledDate,
    gameData: game.gameData,            // the actual puzzle
    manifest: game.gameType.manifest,   // hints, costs, rules
    progress,                           // user's current progress on this game
  })
}
