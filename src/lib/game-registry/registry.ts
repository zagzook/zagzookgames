// =============================================================
// GAME REGISTRY — Central Registration
// All game types are registered here.
//
// TO ADD A NEW GAME TYPE:
//   1. Create a new file in src/lib/game-registry/games/
//      following the pattern of existing entries below
//   2. Import it here and add it to the GAME_REGISTRY array
//   3. Run the seed script to add it to the database
//   That's it. No other files need to change.
// =============================================================

import type { GameTypeDefinition } from "./types"

// Import individual game type definitions
import { zagzookClassic } from "./games/zagzook-classic"
import { wordWeave } from "./games/word-weave"

// -------------------------------------------------------
// THE REGISTRY
// The order here controls display order on the site
// (overridden by sortOrder if set on the DB record)
// -------------------------------------------------------
export const GAME_REGISTRY: GameTypeDefinition[] = [
  zagzookClassic,
  wordWeave,
  // Add new game types here — nothing else needs to change
]

// Lookup a game type by its slug (fast Map for O(1) access)
const registryMap = new Map(
  GAME_REGISTRY.map((game) => [game.slug, game])
)

export function getGameDefinition(slug: string): GameTypeDefinition | undefined {
  return registryMap.get(slug)
}

export function getAllGameSlugs(): string[] {
  return GAME_REGISTRY.map((g) => g.slug)
}
