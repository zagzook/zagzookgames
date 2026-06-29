import type { GameTypeDefinition } from "../types"
export const shikaku: GameTypeDefinition = {
  slug: "shikaku",
  displayName: "Shikaku",
  description: "Divide the grid into rectangles so each contains exactly one number equal to its area.",
  component: "ShikakuBoard",
  sortOrder: 10,
  defaultManifest: {
    levels: ["medium"],
    coinsOnComplete: 50,
    maxHintsPerGame: 3,
    hints: [
      { type: "reveal_block", label: "Reveal a Block", coinCost: 15, description: "Reveals one correct rectangle" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect blocks" },
    ],
    gridSizeRange: { min: 7, max: 12 },
  },
}
