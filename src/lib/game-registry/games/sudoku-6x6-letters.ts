import type { GameTypeDefinition } from "../types"
export const sudoku6x6Letters: GameTypeDefinition = {
  slug: "sudoku-6x6-letters",
  displayName: "Zagdoku Alpha Six",
  description: "Fill every row, column, and 2×3 box with 6 unique letters.",
  component: "SudokuBoard",
  sortOrder: 18,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 45,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct letter for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
    ],
    variant: "6x6-letters",
  },
}
