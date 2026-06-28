// =============================================================
// GAME REGISTRY — Type Definitions
// These types define the shape of every game type and manifest.
// All game types must conform to these interfaces.
// =============================================================

// A single hint option available within a game
export interface HintDefinition {
  type: string       // machine-readable key e.g. "reveal_cell"
  label: string      // shown to the user e.g. "Reveal a Cell"
  coinCost: number   // how many coins this hint costs
  description?: string // optional tooltip text
}

// The full manifest config stored in GameManifest.config (JSON column)
// Each game type has its own manifest defining its rules and economy
export interface GameManifestConfig {
  levels: string[]            // e.g. ["easy", "medium", "hard"]
  hints: HintDefinition[]     // hint types available and their costs
  coinsOnComplete: number     // coins awarded when a game is completed
  maxHintsPerGame?: number    // optional cap on total hints per game
  rules?: string              // optional plain-text rules description
  [key: string]: unknown      // allow game-specific extra fields
}

// A registered game type entry
// One of these exists per game type in the system
export interface GameTypeDefinition {
  slug: string          // unique URL-safe ID e.g. "zagzook-classic"
  displayName: string   // shown to users e.g. "Zagzook Classic"
  description: string   // shown on game type listing pages
  component: string     // name of the React component that renders this game
  defaultManifest: GameManifestConfig // used when seeding a new game type
  sortOrder: number     // display order on the site
}
