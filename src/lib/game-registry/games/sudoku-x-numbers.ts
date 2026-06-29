import type { GameTypeDefinition } from "../types"
export const sudokuXNumbers: GameTypeDefinition = {
  slug: "sudoku-x-numbers",
  displayName: "Sudoku-X (Numbers)",
  description: "Classic 9×9 Sudoku with an extra rule — both main diagonals must also contain 1–9.",
  component: "SudokuBoard",
  sortOrder: 21,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 65,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct number for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
    ],
    variant: "9x9-x-numbers",
  },
}
