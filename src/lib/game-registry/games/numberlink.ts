import type { GameTypeDefinition } from "../types"
export const numberlink: GameTypeDefinition = {
  slug: "numberlink",
  displayName: "Numberlink",
  description: "Connect matching number pairs with paths that fill the entire grid.",
  component: "NumberlinkBoard",
  sortOrder: 7,
  defaultManifest: {
    levels: ["easy", "hard"],
    coinsOnComplete: 50,
    maxHintsPerGame: 3,
    hints: [
      { type: "reveal_path", label: "Reveal a Path", coinCost: 15, description: "Reveals one complete number pair path" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights crossing or incomplete paths" },
    ],
    gridSizeRange: { min: 7, max: 12 },
  },
}
