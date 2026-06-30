import type { GameTypeDefinition } from "../types"
export const slitherlink: GameTypeDefinition = {
  slug: "slitherlink",
  displayName: "ZagLoop",
  description: "Draw a single closed loop around the grid dots — each number shows how many sides are used.",
  component: "SlitherlinkBoard",
  sortOrder: 28,
  defaultManifest: {
    levels: ["easy", "medium", "tricky"],
    coinsOnComplete: 65,
    maxHintsPerGame: 4,
    hints: [
      { type: "reveal_edge", label: "Reveal an Edge", coinCost: 10, description: "Reveals one correct loop edge" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights edges that violate the number clues" },
    ],
    gridSizeRange: { min: 6, max: 12 },
  },
}
