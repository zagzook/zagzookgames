import type { GameTypeDefinition } from "../types"
export const numberSnake: GameTypeDefinition = {
  slug: "number-snake",
  displayName: "Number Snake",
  description: "Draw a snake through the grid that passes through numbers in the correct sequence.",
  component: "NumberSnakeBoard",
  sortOrder: 26,
  defaultManifest: {
    levels: ["medium"],
    coinsOnComplete: 60,
    maxHintsPerGame: 3,
    hints: [
      { type: "reveal_segment", label: "Reveal a Segment", coinCost: 12, description: "Reveals the next segment of the snake" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect path segments" },
    ],
    gridSizeRange: { min: 7, max: 12 },
  },
}
