import type { GameTypeDefinition } from "../types"
export const wordSearch: GameTypeDefinition = {
  slug: "word-search",
  displayName: "Word Search",
  description: "Find all the hidden words in the letter grid — across, down, and diagonal.",
  component: "WordSearchBoard",
  sortOrder: 9,
  defaultManifest: {
    levels: ["medium"],
    coinsOnComplete: 40,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_word", label: "Reveal a Word", coinCost: 12, description: "Highlights one hidden word in the grid" },
      { type: "reveal_first_letter", label: "Show First Letter", coinCost: 5, description: "Marks the starting cell of a random hidden word" },
    ],
    gridSizeRange: { min: 12, max: 16 },
  },
}
