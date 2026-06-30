import type { GameTypeDefinition } from "../types"
export const sudoku8x8Letters: GameTypeDefinition = {
  slug: "sudoku-8x8-letters",
  displayName: "Zagdoku Alpha Eight",
  description: "Fill every row, column, and 2×4 box with 8 unique letters.",
  component: "SudokuBoard",
  sortOrder: 17,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 55,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct letter for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
    ],
    variant: "8x8-letters",
  },
}
