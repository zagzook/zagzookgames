// =============================================================
// GAME DEFINITION — Zagzook Classic (9x9 Sudoku)
// Rename displayName and description to match your final branding.
// Update hints and coinsOnComplete to match your game economy.
// =============================================================

import type { GameTypeDefinition } from "../types"

export const zagzookClassic: GameTypeDefinition = {
  slug: "zagzook-classic",
  displayName: "Zagzook Classic",
  description: "The classic 9x9 number grid puzzle. Fill every row, column, and box with the digits 1–9.",
  component: "ZagzookClassicBoard", // React component name (built in a later step)
  sortOrder: 1,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 50,    // coins awarded for completing any level
    maxHintsPerGame: 5,     // maximum hints allowed per game session
    hints: [
      {
        type: "reveal_cell",
        label: "Reveal a Cell",
        coinCost: 10,
        description: "Reveals the correct number for one cell of your choice",
      },
      {
        type: "highlight_errors",
        label: "Check My Work",
        coinCost: 5,
        description: "Highlights any cells that currently contain an incorrect number",
      },
      {
        type: "reveal_row",
        label: "Reveal a Row",
        coinCost: 25,
        description: "Reveals all correct numbers in one row of your choice",
      },
    ],
    rules: "Fill the 9×9 grid so that every row, column, and 3×3 box contains the digits 1 through 9 exactly once.",
  },
}
