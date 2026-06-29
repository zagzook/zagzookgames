import type { GameTypeDefinition } from "../types"
export const sudoku9x9Numbers: GameTypeDefinition = {
  slug: "sudoku-9x9-numbers",
  displayName: "Classic Sudoku 9×9",
  description: "Fill every row, column, and 3×3 box with digits 1–9.",
  component: "SudokuBoard",
  sortOrder: 1,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 50,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct number for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
      { type: "reveal_row", label: "Reveal a Row", coinCost: 25, description: "Reveals all numbers in one row" },
    ],
    variant: "9x9-numbers",
  },
}
