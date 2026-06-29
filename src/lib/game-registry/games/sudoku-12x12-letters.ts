import type { GameTypeDefinition } from "../types"
export const sudoku12x12Letters: GameTypeDefinition = {
  slug: "sudoku-12x12-letters",
  displayName: "Letter Sudoku 12×12",
  description: "Fill every row, column, and 3×4 box with 12 unique letters.",
  component: "SudokuBoard",
  sortOrder: 19,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 80,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 12, description: "Reveals the correct letter for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
    ],
    variant: "12x12-letters",
  },
}
