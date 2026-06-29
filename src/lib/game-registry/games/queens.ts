import type { GameTypeDefinition } from "../types"
export const queens: GameTypeDefinition = {
  slug: "queens",
  displayName: "Queens",
  description: "Place queens on the grid so that no two queens share a row, column, or color region.",
  component: "QueensBoard",
  sortOrder: 8,
  defaultManifest: {
    levels: ["easy", "hard"],
    coinsOnComplete: 50,
    maxHintsPerGame: 3,
    hints: [
      { type: "reveal_queen", label: "Place a Queen", coinCost: 15, description: "Reveals one correct queen placement" },
      { type: "highlight_errors", label: "Check Conflicts", coinCost: 5, description: "Highlights conflicting queens" },
    ],
    gridSizeRange: { min: 5, max: 8 },
  },
}
