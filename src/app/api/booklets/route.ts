// =============================================================
// API ROUTE — GET /api/booklets
// Returns the list of all published booklets.
// Pro-only endpoint — free users get a 403 with upsell flag.
//
// Does NOT return game content — just booklet metadata and the
// user's overall progress per booklet.
// =============================================================

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // Booklets are Pro-only — check auth and tier first
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be logged in to access booklets.", upsell: false },
      { status: 401 }
    )
  }

  if (session.user.tier !== "PRO") {
    return NextResponse.json(
      { error: "Booklets are available to Pro subscribers only.", upsell: true },
      { status: 403 }
    )
  }

  const userId = session.user.id

  // Fetch all published booklets with chapter counts
  const booklets = await prisma.booklet.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      publishedAt: true,
      gameType: {
        select: {
          slug: true,
          displayName: true,
        },
      },
      // Count chapters so the UI can show "10 chapters / 100 games"
      _count: {
        select: { chapters: true },
      },
    },
    orderBy: { publishedAt: "desc" },
  })

  // Fetch the user's booklet-level progress for all booklets
  const bookletIds = booklets.map((b) => b.id)
  const progressRecords = await prisma.bookletProgress.findMany({
    where: {
      userId,
      bookletId: { in: bookletIds },
      chapterId: null, // null = booklet-level record (not chapter-level)
    },
    select: { bookletId: true, isCompleted: true },
  })

  const progressMap = Object.fromEntries(
    progressRecords.map((p) => [p.bookletId, p.isCompleted])
  )

  // Shape the response
  const result = booklets.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    coverImage: b.coverImage,
    publishedAt: b.publishedAt,
    gameTypeSlug: b.gameType.slug,
    gameTypeDisplayName: b.gameType.displayName,
    chapterCount: b._count.chapters,
    totalGames: b._count.chapters * 10, // always 10 games per chapter
    isCompleted: progressMap[b.id] ?? false,
  }))

  return NextResponse.json({ booklets: result })
}
