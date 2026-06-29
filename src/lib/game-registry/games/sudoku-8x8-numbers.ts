import type { GameTypeDefinition } from "../types"
export const sudoku8x8Numbers: GameTypeDefinition = {
  slug: "sudoku-8x8-numbers",
  displayName: "Classic Sudoku 8×8",
  description: "Fill every row, column, and 2×4 box with digits 1–8.",
  component: "SudokuBoard",
  sortOrder: 2,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 50,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct number for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
      { type: "reveal_row", label: "Reveal a Row", coinCost: 25, description: "Reveals all numbers in one row" },
    ],
    variant: "8x8-numbers",
  },
}
