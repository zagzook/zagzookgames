import type { GameTypeDefinition } from "../types"
export const numberTrail: GameTypeDefinition = {
  slug: "number-trail",
  displayName: "Number Trail",
  description: "Connect the numbers in order by drawing a continuous trail through the grid.",
  component: "NumberTrailBoard",
  sortOrder: 6,
  defaultManifest: {
    levels: ["medium"],
    coinsOnComplete: 50,
    maxHintsPerGame: 3,
    hints: [
      { type: "reveal_next", label: "Reveal Next Step", coinCost: 10, description: "Reveals the next cell in the trail" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect path segments" },
    ],
    gridSizeRange: { min: 7, max: 12 },
  },
}
