import type { GameTypeDefinition } from "../types"
export const sudoku12x12Alphanumeric: GameTypeDefinition = {
  slug: "sudoku-12x12-alphanumeric",
  displayName: "Zagdoku Twelve",
  description: "Fill every row, column, and 3×4 box with digits 1–9 and letters A–C.",
  component: "SudokuBoard",
  sortOrder: 14,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 75,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 12, description: "Reveals the correct value for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
      { type: "reveal_row", label: "Reveal a Row", coinCost: 30, description: "Reveals all values in one row" },
    ],
    variant: "12x12-alphanumeric",
  },
}
