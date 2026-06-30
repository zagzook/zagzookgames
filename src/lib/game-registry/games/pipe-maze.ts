import type { GameTypeDefinition } from "../types"
export const pipeMaze: GameTypeDefinition = {
  slug: "pipe-maze",
  displayName: "ZagFlow",
  description: "Rotate pipe segments to create a connected network from source to destination.",
  component: "PipeMazeBoard",
  sortOrder: 13,
  defaultManifest: {
    levels: ["medium"],
    coinsOnComplete: 60,
    maxHintsPerGame: 3,
    hints: [
      { type: "rotate_correct", label: "Fix a Pipe", coinCost: 12, description: "Rotates one pipe to its correct orientation" },
      { type: "highlight_errors", label: "Show Dead Ends", coinCost: 5, description: "Highlights disconnected pipe segments" },
    ],
    gridSizeRange: { min: 15, max: 25 },
  },
}
