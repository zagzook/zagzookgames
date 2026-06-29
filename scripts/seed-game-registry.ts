// =============================================================
// SEED SCRIPT — Game Registry
// Writes all registered game types and their default manifests
// into the database.
//
// Run with:  npx tsx scripts/seed-game-registry.ts
//
// Safe to re-run: uses upsert so existing records are updated,
// not duplicated.
// =============================================================

import { PrismaClient } from "@prisma/client"
import { GAME_REGISTRY } from "../src/lib/game-registry/registry"

const prisma = new PrismaClient()

async function main() {
  console.log(`Seeding ${GAME_REGISTRY.length} game type(s)...\n`)

  for (const game of GAME_REGISTRY) {
    // Upsert the game type row (create if new, update if changed)
    const gameType = await prisma.gameType.upsert({
      where: { slug: game.slug },
      update: {
        displayName: game.displayName,
        description: game.description,
        component: game.component,
        sortOrder: game.sortOrder,
      },
      create: {
        slug: game.slug,
        displayName: game.displayName,
        description: game.description,
        component: game.component,
        sortOrder: game.sortOrder,
        isActive: true,
      },
    })

    console.log(`✓ GameType: ${game.displayName} (id: ${gameType.id})`)

    // Upsert the manifest for this game type
    await prisma.gameManifest.upsert({
      where: { gameTypeId: gameType.id },
      update: {
        config: game.defaultManifest as never,
        version: "v1",
      },
      create: {
        gameTypeId: gameType.id,
        config: game.defaultManifest as never,
        version: "v1",
      },
    })

    console.log(`  ✓ Manifest seeded (${game.defaultManifest.levels.join(", ")} levels)\n`)
  }

  console.log("Seed complete.")
}

main()
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
