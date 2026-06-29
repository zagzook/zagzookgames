// =============================================================
// ADMIN API — /api/admin/booklets
// GET  — list all booklets (published and draft)
// POST — create a new booklet (header only; chapters added separately)
// =============================================================

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// -------------------------------------------------------
// GET — list all booklets for admin view
// -------------------------------------------------------
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const booklets = await prisma.booklet.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      isPublished: true,
      publishedAt: true,
      gameType: { select: { slug: true, displayName: true } },
      _count: { select: { chapters: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ booklets })
}

// -------------------------------------------------------
// POST — create a new booklet header
// -------------------------------------------------------
const CreateBookletSchema = z.object({
  gameTypeSlug: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
  isPublished: z.boolean().default(false), // default to draft
  publishedAt: z.string().optional(),      // ISO date string
})

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await req.json()
  const parsed = CreateBookletSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { gameTypeSlug, title, description, coverImage, isPublished, publishedAt } = parsed.data

  const gameType = await prisma.gameType.findUnique({
    where: { slug: gameTypeSlug },
    select: { id: true },
  })

  if (!gameType) {
    return NextResponse.json({ error: `Game type "${gameTypeSlug}" not found.` }, { status: 404 })
  }

  const booklet = await prisma.booklet.create({
    data: {
      gameTypeId: gameType.id,
      title,
      description: description ?? null,
      coverImage: coverImage ?? null,
      isPublished,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    },
    select: { id: true, title: true, isPublished: true },
  })

  return NextResponse.json({ booklet }, { status: 201 })
}
