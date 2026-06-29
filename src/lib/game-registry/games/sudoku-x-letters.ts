import type { GameTypeDefinition } from "../types"
export const sudokuXLetters: GameTypeDefinition = {
  slug: "sudoku-x-letters",
  displayName: "Sudoku-X (Letters)",
  description: "Letter Sudoku 9×9 with diagonal constraint — both diagonals must also contain all 9 letters.",
  component: "SudokuBoard",
  sortOrder: 22,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 70,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct letter for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
    ],
    variant: "9x9-x-letters",
  },
}
