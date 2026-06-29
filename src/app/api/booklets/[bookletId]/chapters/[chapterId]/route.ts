// =============================================================
// API ROUTE — GET /api/booklets/[bookletId]/chapters/[chapterId]
// Returns the 10 games for a single chapter, including gameData.
//
// This is the only booklet endpoint that returns puzzle content.
// It is Pro-gated and verifies both the booklet and chapter exist
// and belong to each other before returning anything.
//
// Games are loaded one chapter at a time (10 games) — never
// all 100 games in a booklet at once.
// =============================================================

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookletId: string; chapterId: string }> }
) {
  const { bookletId, chapterId } = await params

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

  // Verify the chapter exists AND belongs to the specified booklet
  // (prevents users from requesting chapters from other booklets)
  const chapter = await prisma.bookletChapter.findFirst({
    where: {
      id: chapterId,
      bookletId, // enforces ownership — chapter must be in this booklet
      booklet: { isPublished: true },
    },
    select: {
      id: true,
      number: true,
      title: true,
      booklet: {
        select: {
          id: true,
          title: true,
          gameType: {
            select: {
              slug: true,
              displayName: true,
              component: true,
            },
          },
        },
      },
      // Fetch all 10 games with full puzzle content
      games: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          title: true,
          level: true,
          gameData: true, // puzzle content — authorized above
        },
      },
    },
  })

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found." }, { status: 404 })
  }

  // Fetch user progress for each game in this chapter
  const gameIds = chapter.games.map((g) => g.id)
  const progressRecords = await prisma.userGameProgress.findMany({
    where: {
      userId,
      bookletGameId: { in: gameIds },
    },
    select: {
      bookletGameId: true,
      isCompleted: true,
      hintsUsed: true,
      timeSpentSecs: true,
    },
  })

  const progressMap = Object.fromEntries(
    progressRecords.map((p) => [p.bookletGameId, p])
  )

  // Ensure a "started" progress record exists for this chapter
  // so we can track chapter-level completion later
  await prisma.bookletProgress.upsert({
    where: {
      userId_bookletId_chapterId: {
        userId,
        bookletId,
        chapterId,
      },
    },
    update: {}, // already exists — leave it alone
    create: {
      userId,
      bookletId,
      chapterId,
      isCompleted: false,
    },
  })

  return NextResponse.json({
    bookletId: chapter.booklet.id,
    bookletTitle: chapter.booklet.title,
    gameTypeSlug: chapter.booklet.gameType.slug,
    component: chapter.booklet.gameType.component,
    chapter: {
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
    },
    games: chapter.games.map((game) => {
      const progress = progressMap[game.id]
      return {
        id: game.id,
        number: game.number,
        title: game.title,
        level: game.level,
        gameData: game.gameData,
        progress: progress
          ? {
              isCompleted: progress.isCompleted,
              hintsUsed: progress.hintsUsed,
              timeSpentSecs: progress.timeSpentSecs,
            }
          : { isCompleted: false, hintsUsed: 0, timeSpentSecs: 0 },
      }
    }),
  })
}
