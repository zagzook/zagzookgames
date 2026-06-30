import type { GameTypeDefinition } from "../types"
export const codeSearch: GameTypeDefinition = {
  slug: "code-search",
  displayName: "ZagCipher",
  description: "Find hidden number sequences in the grid — across, down, and diagonal.",
  component: "CodeSearchBoard",
  sortOrder: 27,
  defaultManifest: {
    levels: ["medium"],
    coinsOnComplete: 50,
    maxHintsPerGame: 5,
    hints: [
      { type: "reveal_code", label: "Reveal a Code", coinCost: 12, description: "Highlights one hidden number sequence" },
      { type: "reveal_first", label: "Show First Digit", coinCost: 5, description: "Marks the starting cell of a random code" },
    ],
    gridSizeRange: { min: 12, max: 16 },
  },
}
