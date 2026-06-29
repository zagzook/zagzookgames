// =============================================================
// API ROUTE — GET /api/games/daily
// Returns the daily game lobby index for a given date.
// This is what populates the daily games screen.
//
// What this returns depends on the caller's subscription tier:
//   FREE user  → free game stubs (full) + pro game stubs (locked, no content)
//   PRO user   → all game stubs (full)
//   Logged out → same as FREE (stubs only, no content)
//
// IMPORTANT: This endpoint NEVER returns gameData (puzzle content).
// Game content is fetched separately via /api/games/daily/[gameId]
// only after a server-side auth + tier check.
// =============================================================

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "@/lib/date-utils"

export async function GET(req: NextRequest) {
  // Read the requested date from query params, default to today
  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get("date") // expected format: YYYY-MM-DD

  // Compare dates as YYYY-MM-DD strings to avoid timezone issues.
  // new Date("2026-06-29") creates UTC midnight which shifts to the
  // previous day in local time — string comparison avoids this entirely.
  const todayStr = new Date().toISOString().split("T")[0]
  const targetDateStr = dateParam ?? todayStr

  // Validate the date string format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 })
  }

  // Parse target date for DB queries (UTC midnight is correct for DB range queries)
  const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`)

  // Get the current user's session (null if not logged in)
  const session = await auth()
  const userTier = session?.user?.tier ?? "FREE"
  const userId = session?.user?.id ?? null

  // -------------------------------------------------------
  // PRO ARCHIVE ACCESS CHECK
  // Compare YYYY-MM-DD strings directly — no timezone drift
  // -------------------------------------------------------
  const oneYearAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  const isToday = targetDateStr === todayStr
  const isPastDate = targetDateStr < todayStr
  const isFutureDate = targetDateStr > todayStr

  // Future dates are not accessible to anyone
  if (isFutureDate) {
    return NextResponse.json({ error: "Future games are not yet available." }, { status: 403 })
  }

  // Past dates require Pro
  if (isPastDate && userTier !== "PRO") {
    return NextResponse.json(
      { error: "Access to past games requires a Pro subscription.", upsell: true },
      { status: 403 }
    )
  }

  // Pro users can only go back 1 year
  if (isPastDate && userTier === "PRO" && targetDateStr < oneYearAgoStr) {
    return NextResponse.json({ error: "Archive access is limited to the past 12 months." }, { status: 403 })
  }

  // -------------------------------------------------------
  // FETCH GAMES FOR THIS DATE
  // We select everything EXCEPT gameData — that stays on the server
  // -------------------------------------------------------
  const games = await prisma.game.findMany({
    where: {
      scheduledDate: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      },
      isPublished: true,
    },
    select: {
      id: true,
      tier: true,
      level: true,
      title: true,
      scheduledDate: true,
      // gameData is intentionally omitted here
      gameType: {
        select: {
          slug: true,
          displayName: true,
          component: true,
        },
      },
    },
    orderBy: [
      { gameType: { sortOrder: "asc" } },
      { tier: "asc" },
      { level: "asc" },
    ],
  })

  // -------------------------------------------------------
  // FETCH USER PROGRESS for these games (if logged in)
  // So the UI can show which games are completed today
  // -------------------------------------------------------
  let progressMap: Record<string, boolean> = {}
  if (userId) {
    const gameIds = games.map((g) => g.id)
    const progress = await prisma.userGameProgress.findMany({
      where: {
        userId,
        gameId: { in: gameIds },
      },
      select: { gameId: true, isCompleted: true },
    })
    progressMap = Object.fromEntries(
      progress.map((p) => [p.gameId, p.isCompleted])
    )
  }

  // -------------------------------------------------------
  // BUILD THE RESPONSE
  // Pro games get a "locked" flag for free users.
  // No game content (gameData) is ever included here.
  // -------------------------------------------------------
  const lobby = games.map((game) => {
    const isLocked = game.tier === "PRO" && userTier !== "PRO"

    return {
      id: game.id,
      gameTypeSlug: game.gameType.slug,
      gameTypeDisplayName: game.gameType.displayName,
      component: game.gameType.component,
      tier: game.tier,
      level: game.level,
      title: game.title,
      scheduledDate: game.scheduledDate,
      isLocked,               // true = show upsell, do not let user play
      isCompleted: progressMap[game.id] ?? false,
    }
  })

  return NextResponse.json({ date: targetDate.toISOString(), games: lobby })
}
