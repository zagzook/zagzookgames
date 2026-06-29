// =============================================================
// ADMIN API — GET /api/admin/users
// Returns paginated user list with subscription info.
// Supports search by email and filter by tier.
// =============================================================

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""
  const tier = searchParams.get("tier")   // "FREE" | "PRO" | null (all)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 25

  const users = await prisma.user.findMany({
    where: {
      ...(search && {
        email: { contains: search, mode: "insensitive" },
      }),
      ...(tier && {
        subscription: { tier: tier as "FREE" | "PRO" },
      }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      isAdmin: true,
      subscription: {
        select: {
          tier: true,
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  })

  const total = await prisma.user.count({
    where: {
      ...(search && {
        email: { contains: search, mode: "insensitive" },
      }),
    },
  })

  return NextResponse.json({ users, total, page, limit })
}
