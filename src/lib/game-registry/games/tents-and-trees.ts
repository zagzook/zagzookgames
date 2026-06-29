import type { GameTypeDefinition } from "../types"
export const tentsAndTrees: GameTypeDefinition = {
  slug: "tents-and-trees",
  displayName: "Tents & Trees",
  description: "Place tents next to trees — match row/column counts and keep tents from touching.",
  component: "TentsTreesBoard",
  sortOrder: 12,
  defaultManifest: {
    levels: ["easy", "hard"],
    coinsOnComplete: 50,
    maxHintsPerGame: 4,
    hints: [
      { type: "reveal_tent", label: "Place a Tent", coinCost: 12, description: "Reveals one correct tent placement" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrectly placed tents" },
    ],
    gridSizeRange: { min: 5, max: 8 },
  },
}
