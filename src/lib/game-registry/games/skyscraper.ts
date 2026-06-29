import type { GameTypeDefinition } from "../types"
export const skyscraper: GameTypeDefinition = {
  slug: "skyscraper",
  displayName: "Skyscraper",
  description: "Place buildings of different heights so the clues outside match how many you can see.",
  component: "SkyscraperBoard",
  sortOrder: 11,
  defaultManifest: {
    levels: ["easy", "hard"],
    coinsOnComplete: 50,
    maxHintsPerGame: 4,
    hints: [
      { type: "reveal_cell", label: "Reveal a Cell", coinCost: 10, description: "Reveals the correct height for one cell" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights cells that violate clues" },
    ],
    gridSizeRange: { min: 5, max: 7 },
  },
}
