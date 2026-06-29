// =============================================================
// ADMIN API — /api/admin/games
// GET  — list scheduled games (filterable by date range / game type)
// POST — schedule a new game (single game, not bulk import)
// =============================================================

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { startOfDay, endOfDay } from "@/lib/date-utils"

// -------------------------------------------------------
// GET — list games with optional filters
// -------------------------------------------------------
export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const gameTypeSlug = searchParams.get("gameType")
  const from = searchParams.get("from")   // YYYY-MM-DD
  const to = searchParams.get("to")       // YYYY-MM-DD
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 50 // games per page

  const games = await prisma.game.findMany({
    where: {
      ...(gameTypeSlug && {
        gameType: { slug: gameTypeSlug },
      }),
      ...(from && {
        scheduledDate: { gte: startOfDay(new Date(from)) },
      }),
      ...(to && {
        scheduledDate: { lte: endOfDay(new Date(to)) },
      }),
    },
    select: {
      id: true,
      scheduledDate: true,
      tier: true,
      level: true,
      title: true,
      isPublished: true,
      gameType: { select: { slug: true, displayName: true } },
    },
    orderBy: { scheduledDate: "asc" },
    skip: (page - 1) * limit,
    take: limit,
  })

  const total = await prisma.game.count({
    where: {
      ...(gameTypeSlug && { gameType: { slug: gameTypeSlug } }),
    },
  })

  return NextResponse.json({ games, total, page, limit })
}

// -------------------------------------------------------
// POST — schedule a single game
// For bulk imports use the CLI script in /scripts
// -------------------------------------------------------
const CreateGameSchema = z.object({
  gameTypeSlug: z.string(),
  scheduledDate: z.string(), // YYYY-MM-DD
  tier: z.enum(["FREE", "PRO"]),
  level: z.string().optional(),
  title: z.string().optional(),
  gameData: z.record(z.string(), z.unknown()), // the puzzle JSON — Zod v4 requires both key and value types
  isPublished: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await req.json()
  const parsed = CreateGameSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { gameTypeSlug, scheduledDate, tier, level, title, gameData, isPublished } = parsed.data

  // Look up the game type by slug
  const gameType = await prisma.gameType.findUnique({
    where: { slug: gameTypeSlug },
    select: { id: true },
  })

  if (!gameType) {
    return NextResponse.json({ error: `Game type "${gameTypeSlug}" not found.` }, { status: 404 })
  }

  // Create the game record
  const game = await prisma.game.create({
    data: {
      gameTypeId: gameType.id,
      scheduledDate: new Date(`${scheduledDate}T00:00:00.000Z`),
      tier,
      level: level ?? null,
      title: title ?? null,
      gameData: gameData as unknown as Prisma.InputJsonValue,
      isPublished,
    },
    select: { id: true, scheduledDate: true, tier: true, level: true },
  })

  return NextResponse.json({ game }, { status: 201 })
}
