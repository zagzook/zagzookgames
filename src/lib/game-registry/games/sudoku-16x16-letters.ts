import type { GameTypeDefinition } from "../types"
export const sudoku16x16Letters: GameTypeDefinition = {
  slug: "sudoku-16x16-letters",
  displayName: "Letter Sudoku 16×16",
  description: "Fill every row, column, and 4×4 box with 16 unique letters.",
  component: "SudokuBoard",
  sortOrder: 20,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 100,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 15, description: "Reveals the correct letter for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
    ],
    variant: "16x16-letters",
  },
}
