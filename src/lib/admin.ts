// =============================================================
// ADMIN GUARD
// Call this at the top of every admin API route and server
// component. Returns the session if the user is an admin,
// throws a 403 response if not.
//
// Admin status is stored in the database (isAdmin flag on User).
// It is NOT stored in the JWT — so revoking admin access takes
// effect immediately without waiting for token expiry.
// =============================================================

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Login required." }, { status: 401 }),
    }
  }

  // Check isAdmin from the database — not the JWT
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  if (!user?.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin access required." }, { status: 403 }),
    }
  }

  return { ok: true, userId: session.user.id }
}
