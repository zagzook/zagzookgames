import type { GameTypeDefinition } from "../types"
export const hyperSudokuNumbers: GameTypeDefinition = {
  slug: "hyper-sudoku-numbers",
  displayName: "Zagdoku Hyper",
  description: "Classic 9×9 Sudoku with 4 extra shaded 3×3 regions that must also contain 1–9.",
  component: "SudokuBoard",
  sortOrder: 23,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 65,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct number for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights incorrect cells" },
    ],
    variant: "9x9-hyper-numbers",
  },
}
