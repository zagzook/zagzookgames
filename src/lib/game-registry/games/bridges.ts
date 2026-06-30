import type { GameTypeDefinition } from "../types"
export const bridges: GameTypeDefinition = {
  slug: "bridges",
  displayName: "Island Zag",
  description: "Connect all islands with bridges — each island's bridge count must match its number.",
  component: "BridgesBoard",
  sortOrder: 5,
  defaultManifest: {
    levels: ["medium"],
    coinsOnComplete: 50,
    maxHintsPerGame: 3,
    hints: [
      { type: "reveal_bridge", label: "Reveal a Bridge", coinCost: 12, description: "Reveals one correct bridge connection" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect connections" },
    ],
    gridSizeRange: { min: 6, max: 12 },
  },
}
