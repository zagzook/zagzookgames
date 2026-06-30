// =============================================================
// GAME REGISTRY — Central Registration
// All 30 game types are registered here.
//
// TO ADD A NEW GAME TYPE:
//   1. Create a new file in src/lib/game-registry/games/
//   2. Import it here and add it to GAME_REGISTRY
//   3. Run: npx tsx scripts/seed-game-registry.ts
//   That's it. No other files need to change.
//
// Current count: 31 game types (13 free, 18 pro)
// =============================================================

import type { GameTypeDefinition } from "./types"

// FREE GAMES (13)
import { sudoku9x9Numbers } from "./games/sudoku-9x9-numbers"
import { sudoku8x8Numbers } from "./games/sudoku-8x8-numbers"
import { sudoku6x6Numbers } from "./games/sudoku-6x6-numbers"
import { binaryPuzzle } from "./games/binary-puzzle"
import { bridges } from "./games/bridges"
import { numberTrail } from "./games/number-trail"
import { numberlink } from "./games/numberlink"
import { queens } from "./games/queens"
import { wordSearch } from "./games/word-search"
import { shikaku } from "./games/shikaku"
import { skyscraper } from "./games/skyscraper"
import { tentsAndTrees } from "./games/tents-and-trees"
import { pipeMaze } from "./games/pipe-maze"

// PRO GAMES (17)
import { sudoku12x12Alphanumeric } from "./games/sudoku-12x12-alphanumeric"
import { sudoku16x16Hex } from "./games/sudoku-16x16-hex"
import { sudoku9x9Letters } from "./games/sudoku-9x9-letters"
import { sudoku8x8Letters } from "./games/sudoku-8x8-letters"
import { sudoku6x6Letters } from "./games/sudoku-6x6-letters"
import { sudoku12x12Letters } from "./games/sudoku-12x12-letters"
import { sudoku16x16Letters } from "./games/sudoku-16x16-letters"
import { sudokuXNumbers } from "./games/sudoku-x-numbers"
import { sudokuXLetters } from "./games/sudoku-x-letters"
import { hyperSudokuNumbers } from "./games/hyper-sudoku-numbers"
import { hyperSudokuLetters } from "./games/hyper-sudoku-letters"
import { galaxies } from "./games/galaxies"
import { numberSnake } from "./games/number-snake"
import { codeSearch } from "./games/code-search"
import { slitherlink } from "./games/slitherlink"
import { trainTracks } from "./games/train-tracks"
import { yinYang } from "./games/yin-yang"
import { crossSum } from "./games/cross-sum"

export const GAME_REGISTRY: GameTypeDefinition[] = [
  // FREE GAMES
  sudoku9x9Numbers,
  sudoku8x8Numbers,
  sudoku6x6Numbers,
  binaryPuzzle,
  bridges,
  numberTrail,
  numberlink,
  queens,
  wordSearch,
  shikaku,
  skyscraper,
  tentsAndTrees,
  pipeMaze,
  // PRO GAMES
  sudoku12x12Alphanumeric,
  sudoku16x16Hex,
  sudoku9x9Letters,
  sudoku8x8Letters,
  sudoku6x6Letters,
  sudoku12x12Letters,
  sudoku16x16Letters,
  sudokuXNumbers,
  sudokuXLetters,
  hyperSudokuNumbers,
  hyperSudokuLetters,
  galaxies,
  numberSnake,
  codeSearch,
  slitherlink,
  trainTracks,
  yinYang,
  crossSum,
]

const registryMap = new Map(GAME_REGISTRY.map((g) => [g.slug, g]))
export function getGameDefinition(slug: string): GameTypeDefinition | undefined {
  return registryMap.get(slug)
}
export function getAllGameSlugs(): string[] {
  return GAME_REGISTRY.map((g) => g.slug)
}
