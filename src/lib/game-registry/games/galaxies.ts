import type { GameTypeDefinition } from "../types"
export const galaxies: GameTypeDefinition = {
  slug: "galaxies",
  displayName: "ZagGalaxy",
  description: "Divide the grid into rotationally symmetric galaxies, each centred on a dot.",
  component: "GalaxiesBoard",
  sortOrder: 25,
  defaultManifest: {
    levels: ["medium"],
    coinsOnComplete: 60,
    maxHintsPerGame: 3,
    hints: [
      { type: "reveal_galaxy", label: "Reveal a Galaxy", coinCost: 15, description: "Reveals one complete galaxy region" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights asymmetric or incorrect regions" },
    ],
    gridSizeRange: { min: 7, max: 12 },
  },
}
