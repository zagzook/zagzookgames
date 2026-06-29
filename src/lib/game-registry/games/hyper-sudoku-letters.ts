import type { GameTypeDefinition } from "../types"
export const hyperSudokuLetters: GameTypeDefinition = {
  slug: "hyper-sudoku-letters",
  displayName: "Hyper Sudoku (Letters)",
  description: "Letter Sudoku 9×9 with 4 extra shaded 3×3 regions that must also contain all 9 letters.",
  component: "SudokuBoard",
  sortOrder: 24,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 70,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct letter for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
    ],
    variant: "9x9-hyper-letters",
  },
}
