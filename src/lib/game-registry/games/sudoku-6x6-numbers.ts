import type { GameTypeDefinition } from "../types"
export const sudoku6x6Numbers: GameTypeDefinition = {
  slug: "sudoku-6x6-numbers",
  displayName: "Classic Sudoku 6×6",
  description: "Fill every row, column, and 2×3 box with digits 1–6.",
  component: "SudokuBoard",
  sortOrder: 3,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 40,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct number for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
    ],
    variant: "6x6-numbers",
  },
}
