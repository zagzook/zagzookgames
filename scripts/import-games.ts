// =============================================================
// BULK IMPORT SCRIPT — Daily Games & Booklets
//
// Reads JSON files from an import folder and writes them to the DB.
// Safe to re-run: skips games/booklets that already exist (upsert).
//
// USAGE:
//   Import daily games:
//     npx tsx scripts/import-games.ts --type=daily --dir=C:\path\to\import-data
//
//   Import booklets:
//     npx tsx scripts/import-games.ts --type=booklets --dir=C:\path\to\import-data
//
// EXPECTED FOLDER STRUCTURE:
//   /import-data/
//     /games/      ← individual game JSON files
//     /daily/      ← daily manifest files (one per day, named YYYY-MM-DD.json)
//     /booklets/   ← booklet manifest files
//
// DAILY MANIFEST FORMAT (2025-01-01.json):
//   {
//     "date": "2025-01-01",
//     "games": [
//       { "file": "zgc-easy-00001.json", "tier": "FREE" },
//       { "file": "zgc-hard-00001.json", "tier": "PRO" }
//     ]
//   }
//
// BOOKLET MANIFEST FORMAT (zagzook-classic-vol-1.json):
//   {
//     "gameType": "zagzook-classic",
//     "title": "Zagzook Classic Vol. 1",
//     "description": "...",
//     "publishedAt": "2025-02-01",
//     "chapters": [
//       {
//         "number": 1,
//         "title": "Chapter 1",
//         "games": [
//           { "number": 1, "file": "zgc-easy-00201.json" }
//         ]
//       }
//     ]
//   }
//
// INDIVIDUAL GAME FILE FORMAT (zgc-easy-00001.json):
//   {
//     "gameType": "zagzook-classic",
//     "level": "easy",
//     "title": "Optional title",
//     "gameData": { ... }
//   }
// =============================================================

import { PrismaClient, Prisma } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

// =============================================================
// TYPE DEFINITIONS — mirrors the JSON file structures above
// =============================================================

interface GameFile {
  gameType: string
  level?: string
  title?: string
  gameData: Record<string, unknown>
}

interface DailyManifestEntry {
  file: string
  tier: "FREE" | "PRO"
}

interface DailyManifest {
  date: string // YYYY-MM-DD
  games: DailyManifestEntry[]
}

interface BookletGameEntry {
  number: number
  file: string
}

interface BookletChapterEntry {
  number: number
  title?: string
  games: BookletGameEntry[]
}

interface BookletManifest {
  gameType: string
  title: string
  description?: string
  publishedAt?: string
  chapters: BookletChapterEntry[]
}

// =============================================================
// HELPERS
// =============================================================

// Reads and parses a JSON file — throws with a clear error if it fails
function readJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  const raw = fs.readFileSync(filePath, "utf-8")
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`Invalid JSON in file: ${filePath}`)
  }
}

// Looks up a game type in the DB by slug — throws if not registered
async function getGameTypeId(slug: string): Promise<string> {
  const gameType = await prisma.gameType.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!gameType) {
    throw new Error(
      `Game type "${slug}" not found in database. Run seed-game-registry.ts first.`
    )
  }
  return gameType.id
}

// =============================================================
// IMPORT DAILY GAMES
// Reads every manifest in /daily/ and imports the referenced games
// =============================================================

async function importDailyGames(importDir: string) {
  const dailyDir = path.join(importDir, "daily")
  const gamesDir = path.join(importDir, "games")

  if (!fs.existsSync(dailyDir)) {
    throw new Error(`Daily manifests folder not found: ${dailyDir}`)
  }
  if (!fs.existsSync(gamesDir)) {
    throw new Error(`Games folder not found: ${gamesDir}`)
  }

  // Read all manifest files from the daily folder
  const manifestFiles = fs
    .readdirSync(dailyDir)
    .filter((f) => f.endsWith(".json"))
    .sort() // sort by filename (which is the date) so we import in order

  console.log(`\nFound ${manifestFiles.length} daily manifest(s) to process.\n`)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const manifestFile of manifestFiles) {
    const manifestPath = path.join(dailyDir, manifestFile)
    let manifest: DailyManifest

    try {
      manifest = readJson<DailyManifest>(manifestPath)
    } catch (err) {
      console.error(`  ✗ Error reading manifest ${manifestFile}: ${err}`)
      errors++
      continue
    }

    // Validate the date field
    const scheduledDate = new Date(`${manifest.date}T00:00:00.000Z`)
    if (isNaN(scheduledDate.getTime())) {
      console.error(`  ✗ Invalid date in ${manifestFile}: "${manifest.date}"`)
      errors++
      continue
    }

    console.log(`Processing: ${manifest.date} (${manifest.games.length} game(s))`)

    for (const entry of manifest.games) {
      const gameFilePath = path.join(gamesDir, entry.file)
      let gameFile: GameFile

      try {
        gameFile = readJson<GameFile>(gameFilePath)
      } catch (err) {
        console.error(`    ✗ Error reading game file ${entry.file}: ${err}`)
        errors++
        continue
      }

      try {
        const gameTypeId = await getGameTypeId(gameFile.gameType)

        // Upsert — safe to re-run without creating duplicates
        // The unique constraint is (gameTypeId, scheduledDate, tier, level)
        await prisma.game.upsert({
          where: {
            gameTypeId_scheduledDate_tier_level: {
              gameTypeId,
              scheduledDate,
              tier: entry.tier,
              level: gameFile.level ?? "",
            },
          },
          update: {
            // Update title and gameData if re-importing a corrected file
            title: gameFile.title ?? null,
            gameData: gameFile.gameData as unknown as Prisma.InputJsonValue,
          },
          create: {
            gameTypeId,
            scheduledDate,
            tier: entry.tier,
            level: gameFile.level ?? null,
            title: gameFile.title ?? null,
            gameData: gameFile.gameData as unknown as Prisma.InputJsonValue,
            isPublished: true,
          },
        })

        console.log(`    ✓ ${entry.file} → ${manifest.date} [${entry.tier}]`)
        imported++
      } catch (err) {
        console.error(`    ✗ Failed to import ${entry.file}: ${err}`)
        errors++
      }
    }
  }

  console.log(`\n${"─".repeat(50)}`)
  console.log(`Daily import complete.`)
  console.log(`  Imported/updated : ${imported}`)
  console.log(`  Skipped (exists) : ${skipped}`)
  console.log(`  Errors           : ${errors}`)
}

// =============================================================
// IMPORT BOOKLETS
// Reads every manifest in /booklets/ and imports chapters + games
// =============================================================

async function importBooklets(importDir: string) {
  const bookletDir = path.join(importDir, "booklets")
  const gamesDir = path.join(importDir, "games")

  if (!fs.existsSync(bookletDir)) {
    throw new Error(`Booklets folder not found: ${bookletDir}`)
  }
  if (!fs.existsSync(gamesDir)) {
    throw new Error(`Games folder not found: ${gamesDir}`)
  }

  const manifestFiles = fs
    .readdirSync(bookletDir)
    .filter((f) => f.endsWith(".json"))
    .sort()

  console.log(`\nFound ${manifestFiles.length} booklet manifest(s) to process.\n`)

  let bookletCount = 0
  let gameCount = 0
  let errors = 0

  for (const manifestFile of manifestFiles) {
    const manifestPath = path.join(bookletDir, manifestFile)
    let manifest: BookletManifest

    try {
      manifest = readJson<BookletManifest>(manifestPath)
    } catch (err) {
      console.error(`  ✗ Error reading ${manifestFile}: ${err}`)
      errors++
      continue
    }

    console.log(`Processing booklet: "${manifest.title}"`)

    try {
      const gameTypeId = await getGameTypeId(manifest.gameType)

      // Create or update the booklet header
      const booklet = await prisma.booklet.upsert({
        where: {
          // Use title + gameTypeId as a logical unique key
          // (no unique constraint on title, so we check manually)
          id: (await prisma.booklet.findFirst({
            where: { title: manifest.title, gameTypeId },
            select: { id: true },
          }))?.id ?? "new", // "new" triggers the create branch
        },
        update: {
          description: manifest.description ?? null,
          publishedAt: manifest.publishedAt ? new Date(manifest.publishedAt) : null,
          isPublished: !!manifest.publishedAt,
        },
        create: {
          gameTypeId,
          title: manifest.title,
          description: manifest.description ?? null,
          publishedAt: manifest.publishedAt ? new Date(manifest.publishedAt) : null,
          isPublished: !!manifest.publishedAt,
        },
      })

      console.log(`  ✓ Booklet: "${booklet.id}"`)
      bookletCount++

      // Process each chapter
      for (const chapterEntry of manifest.chapters) {
        const chapter = await prisma.bookletChapter.upsert({
          where: {
            bookletId_number: {
              bookletId: booklet.id,
              number: chapterEntry.number,
            },
          },
          update: { title: chapterEntry.title ?? null },
          create: {
            bookletId: booklet.id,
            number: chapterEntry.number,
            title: chapterEntry.title ?? null,
          },
        })

        // Process each game in the chapter
        for (const gameEntry of chapterEntry.games) {
          const gameFilePath = path.join(gamesDir, gameEntry.file)
          let gameFile: GameFile

          try {
            gameFile = readJson<GameFile>(gameFilePath)
          } catch (err) {
            console.error(`    ✗ Error reading ${gameEntry.file}: ${err}`)
            errors++
            continue
          }

          await prisma.bookletGame.upsert({
            where: {
              chapterId_number: {
                chapterId: chapter.id,
                number: gameEntry.number,
              },
            },
            update: {
              gameData: gameFile.gameData as unknown as Prisma.InputJsonValue,
              title: gameFile.title ?? null,
              level: gameFile.level ?? null,
            },
            create: {
              chapterId: chapter.id,
              number: gameEntry.number,
              title: gameFile.title ?? null,
              level: gameFile.level ?? null,
              gameData: gameFile.gameData as unknown as Prisma.InputJsonValue,
            },
          })

          console.log(`    ✓ Ch${chapterEntry.number} Game ${gameEntry.number}: ${gameEntry.file}`)
          gameCount++
        }
      }
    } catch (err) {
      console.error(`  ✗ Failed to import booklet "${manifest.title}": ${err}`)
      errors++
    }
  }

  console.log(`\n${"─".repeat(50)}`)
  console.log(`Booklet import complete.`)
  console.log(`  Booklets imported : ${bookletCount}`)
  console.log(`  Games imported    : ${gameCount}`)
  console.log(`  Errors            : ${errors}`)
}

// =============================================================
// MAIN — parse CLI arguments and run the correct importer
// =============================================================

async function main() {
  // Parse --type and --dir from command line arguments
  const args = process.argv.slice(2)
  const typeArg = args.find((a) => a.startsWith("--type="))?.split("=")[1]
  const dirArg = args.find((a) => a.startsWith("--dir="))?.split("=")[1]

  if (!typeArg || !dirArg) {
    console.error("Usage:")
    console.error("  npx tsx scripts/import-games.ts --type=daily --dir=C:\\path\\to\\import-data")
    console.error("  npx tsx scripts/import-games.ts --type=booklets --dir=C:\\path\\to\\import-data")
    process.exit(1)
  }

  if (!fs.existsSync(dirArg)) {
    console.error(`Import directory not found: ${dirArg}`)
    process.exit(1)
  }

  console.log(`\nZagzook Games — Bulk Import`)
  console.log(`Type      : ${typeArg}`)
  console.log(`Directory : ${dirArg}`)
  console.log(`${"─".repeat(50)}`)

  if (typeArg === "daily") {
    await importDailyGames(dirArg)
  } else if (typeArg === "booklets") {
    await importBooklets(dirArg)
  } else {
    console.error(`Unknown type "${typeArg}". Use "daily" or "booklets".`)
    process.exit(1)
  }
}

main()
  .catch((err) => {
    console.error("\nFatal error:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
