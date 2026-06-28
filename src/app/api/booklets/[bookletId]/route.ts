// =============================================================
// API ROUTE — GET /api/booklets/[bookletId]
// Returns the booklet's chapter list and user progress.
// Does NOT return game content — chapters are loaded individually.
//
// Pro-only. Returns 403 + upsell for free users.
// =============================================================

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookletId: string }> }
) {
  const { bookletId } = await params

  // Pro-only access check
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Login required.", upsell: false }, { status: 401 })
  }
  if (session.user.tier !== "PRO") {
    return NextResponse.json(
      { error: "Booklets require a Pro subscription.", upsell: true },
      { status: 403 }
    )
  }

  const userId = session.user.id

  // Fetch the booklet with all chapter metadata (no game content)
  const booklet = await prisma.booklet.findUnique({
    where: { id: bookletId, isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      gameType: {
        select: {
          slug: true,
          displayName: true,
          component: true,
          manifest: {
            select: { config: true },
          },
        },
      },
      chapters: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          title: true,
          // Count games per chapter for the UI progress bar
          _count: { select: { games: true } },
        },
      },
    },
  })

  if (!booklet) {
    return NextResponse.json({ error: "Booklet not found." }, { status: 404 })
  }

  // Fetch the user's chapter-level progress for this booklet
  const chapterIds = booklet.chapters.map((c) => c.id)
  const chapterProgress = await prisma.bookletProgress.findMany({
    where: {
      userId,
      bookletId,
      chapterId: { in: chapterIds },
    },
    select: { chapterId: true, isCompleted: true },
  })

  const chapterProgressMap = Object.fromEntries(
    chapterProgress.map((p) => [p.chapterId, p.isCompleted])
  )

  // Fetch overall booklet-level progress
  const bookletProgress = await prisma.bookletProgress.findFirst({
    where: { userId, bookletId, chapterId: null },
    select: { isCompleted: true },
  })

  // Shape the response — no game content included
  return NextResponse.json({
    id: booklet.id,
    title: booklet.title,
    description: booklet.description,
    coverImage: booklet.coverImage,
    gameTypeSlug: booklet.gameType.slug,
    gameTypeDisplayName: booklet.gameType.displayName,
    component: booklet.gameType.component,
    manifest: booklet.gameType.manifest,
    isCompleted: bookletProgress?.isCompleted ?? false,
    chapters: booklet.chapters.map((chapter) => ({
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
      gameCount: chapter._count.games,
      isCompleted: chapterProgressMap[chapter.id] ?? false,
    })),
  })
}
