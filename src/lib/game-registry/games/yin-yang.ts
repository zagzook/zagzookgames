import type { GameTypeDefinition } from "../types"
export const yinYang: GameTypeDefinition = {
  slug: "yin-yang",
  displayName: "ZagBalance",
  description: "Fill the grid with black and white circles so each colour forms one connected group with no 2×2 block.",
  component: "YinYangBoard",
  sortOrder: 30,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 60,
    maxHintsPerGame: 4,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct colour for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights disconnected groups or 2×2 violations" },
    ],
    gridSizeRange: { min: 8, max: 12 },
  },
}
