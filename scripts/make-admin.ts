// =============================================================
// SCRIPT — Make a user an admin
// Run with: npx tsx scripts/make-admin.ts your@email.com
//
// Only run this manually for trusted users.
// Admin status grants full access to /api/admin/* endpoints.
// =============================================================

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts your@email.com")
    process.exit(1)
  }

  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
    select: { id: true, email: true, isAdmin: true },
  })

  console.log(`✓ Admin granted to: ${user.email} (id: ${user.id})`)
}

main()
  .catch((err) => {
    console.error("Failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
