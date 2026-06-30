import type { GameTypeDefinition } from "../types"
export const sudoku9x9Letters: GameTypeDefinition = {
  slug: "sudoku-9x9-letters",
  displayName: "Zagdoku Alpha Classic",
  description: "Fill every row, column, and 3×3 box with 9 unique letters.",
  component: "SudokuBoard",
  sortOrder: 16,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 60,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct letter for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
    ],
    variant: "9x9-letters",
  },
}
