// =============================================================
// GAME DEFINITION — Word Weave
// Placeholder — update displayName, description, hints, and
// component name once your game is finalised.
// =============================================================

import type { GameTypeDefinition } from "../types"

export const wordWeave: GameTypeDefinition = {
  slug: "word-weave",
  displayName: "Word Weave",
  description: "Weave together letters to uncover hidden words. A daily word puzzle with a Zagzook twist.",
  component: "WordWeaveBoard", // React component name (built in a later step)
  sortOrder: 2,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 50,
    maxHintsPerGame: 3,
    hints: [
      {
        type: "reveal_letter",
        label: "Reveal a Letter",
        coinCost: 10,
        description: "Reveals one letter in the puzzle",
      },
      {
        type: "reveal_word",
        label: "Reveal a Word",
        coinCost: 30,
        description: "Reveals one complete hidden word",
      },
    ],
    rules: "Find all the hidden words woven into the letter grid.",
  },
}
