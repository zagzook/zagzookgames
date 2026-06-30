// =============================================================
// GAME DEFINITION — Cross Sum (Kakuro)
// A crossword-style number puzzle where digits 1–9 fill the
// white cells so that each run of cells sums to the clue shown.
// No digit may repeat within a single run.
// =============================================================

import type { GameTypeDefinition } from "../types"

export const crossSum: GameTypeDefinition = {
  slug: "cross-sum",
  displayName: "Cross Sum",
  description: "Fill the grid with digits 1–9 so every row and column run adds up to its clue. No repeats allowed in a run.",
  component: "CrossSumBoard",
  sortOrder: 31,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 60,
    maxHintsPerGame: 4,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct digit for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights cells that violate sum or uniqueness rules" },
      { type: "reveal_run", label: "Reveal a Run", coinCost: 25, description: "Reveals all digits in one complete row or column run" },
    ],
  },
}
