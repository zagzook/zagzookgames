import type { GameTypeDefinition } from "../types"
export const binaryPuzzle: GameTypeDefinition = {
  slug: "binary-puzzle",
  displayName: "Binary Puzzle",
  description: "Fill the grid with 0s and 1s — no three in a row, equal counts per row and column.",
  component: "BinaryBoard",
  sortOrder: 4,
  defaultManifest: {
    levels: ["easy", "hard"],
    coinsOnComplete: 50,
    maxHintsPerGame: 4,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct value for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
    ],
    gridSizeRange: { min: 6, max: 12 },
  },
}
