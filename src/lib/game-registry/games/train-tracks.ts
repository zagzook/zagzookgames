import type { GameTypeDefinition } from "../types"
export const trainTracks: GameTypeDefinition = {
  slug: "train-tracks",
  displayName: "ZagRail",
  description: "Lay track pieces to complete a rail route from entry to exit — row and column counts must match.",
  component: "TrainTracksBoard",
  sortOrder: 29,
  defaultManifest: {
    levels: ["easy", "medium", "hard"],
    coinsOnComplete: 65,
    maxHintsPerGame: 4,
    hints: [
      { type: "reveal_track", label: "Reveal a Track", coinCost: 12, description: "Reveals one correct track segment" },
      { type: "highlight_errors", label: "Check My Work", coinCost: 5, description: "Highlights track pieces that violate row/column counts" },
    ],
    gridSize: 12,
  },
}
