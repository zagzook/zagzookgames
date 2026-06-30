// =============================================================
// GAME PLAYER PAGE — /play/[gameId]
//
// This is the page the user lands on after clicking "Play" on
// a game tile. It:
//   1. Fetches full puzzle content from /api/games/daily/[gameId]
//      (server-side auth + tier check — never served to unauthorized users)
//   2. Renders the correct game board component for the game type,
//      or a placeholder if that component hasn't been built yet
//   3. Shows a hint panel:
//        - Right sidebar on desktop (lg: breakpoint)
//        - Bottom panel on mobile
//   4. On puzzle completion, calls /api/coins/earn and shows a
//      win overlay with the coins awarded
//   5. On hint purchase, calls /api/coins/spend and passes the
//      active hint down to the board component
// =============================================================

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// =============================================================
// TYPES
// =============================================================

// Shape of one hint definition from the game manifest
interface HintDefinition {
  type: string        // e.g. "reveal_cell", "highlight_errors"
  label: string       // e.g. "Reveal a Cell"
  coinCost: number    // always from server manifest, never client
  description: string // tooltip / description shown in the panel
}

// The manifest config stored in DB for each game type
interface ManifestConfig {
  coinsOnComplete: number     // coins awarded on puzzle completion
  maxHintsPerGame: number     // max hints a player can buy per game
  hints: HintDefinition[]     // available hint types for this game
}

// Full payload returned by GET /api/games/daily/[gameId]
interface GamePayload {
  id: string
  gameTypeSlug: string         // e.g. "sudoku-9x9-numbers"
  gameTypeDisplayName: string  // e.g. "Zagdoku Classic"
  component: string            // e.g. "SudokuBoard" — maps to a React component
  tier: "FREE" | "PRO"
  level: string | null         // "easy" | "medium" | "hard" | null
  title: string | null         // optional custom title per puzzle
  scheduledDate: string
  gameData: unknown            // the actual puzzle data (structure varies by game type)
  manifest: {
    config: ManifestConfig
    version: number
  }
  progress: {
    isCompleted: boolean       // true if this user already solved this game
    hintsUsed: number          // how many hints they've already bought
    timeSpentSecs: number
  }
}

// A hint that has been purchased and is active — passed to the board component
interface HintRequest {
  type: string   // matches HintDefinition.type
  label: string
}

// =============================================================
// BOARD COMPONENT INTERFACE
// Every game board component must accept these props.
// =============================================================
export interface BoardProps {
  gameData: unknown            // puzzle content — each game type parses this itself
  gameTypeSlug: string         // slug of the game type, for context
  level: string | null         // difficulty level
  onComplete: () => void       // call this when the user solves the puzzle
  activeHint: HintRequest | null  // a hint just purchased — board applies it
  onHintConsumed: () => void   // call this after the board has applied the hint
}

// =============================================================
// BOARD COMPONENT REGISTRY
//
// Map component name (from DB) → actual React component.
// Add entries here as each real game board is built.
// Any name not found here falls back to PlaceholderBoard.
//
// Example (once SudokuBoard is built):
//   import { SudokuBoard } from "@/components/game-boards/SudokuBoard"
//   const BOARD_COMPONENTS: Record<...> = { SudokuBoard, ... }
// =============================================================
const BOARD_COMPONENTS: Record<string, React.ComponentType<BoardProps>> = {
  // 'SudokuBoard':    SudokuBoard,
  // 'ZagFlipBoard':   ZagFlipBoard,
  // 'IslandZagBoard': IslandZagBoard,
  // ... add more as each game is built
}

// Resolves the component name to a React component.
// Falls back to the placeholder if the component doesn't exist yet.
function getBoard(componentName: string): React.ComponentType<BoardProps> {
  return BOARD_COMPONENTS[componentName] ?? PlaceholderBoard
}

// =============================================================
// PLACEHOLDER BOARD
// Shown for any game type whose board hasn't been built yet.
// =============================================================
function PlaceholderBoard({ gameTypeSlug }: BoardProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
      <div className="text-5xl mb-4">🧩</div>
      <h2 className="text-xl font-semibold mb-2">Game board coming soon</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        The{" "}
        <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
          {gameTypeSlug}
        </span>{" "}
        board component is being built. Check back soon!
      </p>
    </div>
  )
}

// =============================================================
// WIN OVERLAY
// Shown after the user successfully completes a puzzle.
// Displays coins earned and new balance with a celebration modal.
// =============================================================
function WinOverlay({
  gameTypeDisplayName,
  coinsAwarded,
  newBalance,
  onClose,
}: {
  gameTypeDisplayName: string
  coinsAwarded: number
  newBalance: number
  onClose: () => void
}) {
  return (
    // Semi-transparent backdrop with blur
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl border shadow-xl p-8 max-w-sm w-full text-center">

        {/* Celebration icon */}
        <div className="text-6xl mb-4">🎉</div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-1">You solved it!</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {gameTypeDisplayName} — puzzle complete
        </p>

        {/* Coin reward card */}
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 mb-6">
          <p className="text-3xl font-bold text-yellow-700">+{coinsAwarded}</p>
          <p className="text-sm text-yellow-600 mt-1">coins earned</p>
          <p className="text-xs text-yellow-500 mt-2">New balance: {newBalance} coins</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/play">Back to Games</Link>
          </Button>
          {/* "Keep Playing" lets them review the board without the overlay */}
          <Button variant="outline" className="w-full" onClick={onClose}>
            View Board
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================
// HINT PANEL
//
// Renders a list of purchasable hints.
// Layout is controlled by the parent — this component just
// renders the hint list itself (card wrapper is in the parent).
//
// Security note: coin cost is validated server-side. The client
// only sends the hint type string — the server looks up the cost.
// =============================================================
function HintPanel({
  hints,
  hintsUsed,
  maxHints,
  gameId,
  alreadyCompleted,
  onHintTriggered,
}: {
  hints: HintDefinition[]
  hintsUsed: number
  maxHints: number
  gameId: string
  alreadyCompleted: boolean     // no hints if game is already done
  onHintTriggered: (hint: HintRequest, newBalance: number) => void
}) {
  // Track which hint type is currently being purchased (shows loading state)
  const [loadingHint, setLoadingHint] = useState<string | null>(null)
  const [error, setError] = useState("")

  // How many hints the user has left for this game
  const hintsRemaining = Math.max(0, maxHints - hintsUsed)
  const isExhausted = hintsRemaining === 0 || alreadyCompleted

  async function handleHint(hint: HintDefinition) {
    if (isExhausted || loadingHint) return
    setLoadingHint(hint.type)
    setError("")

    try {
      const res = await fetch("/api/coins/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send only the hint TYPE — cost is looked up server-side from the manifest
        body: JSON.stringify({ hintType: hint.type, gameId }),
      })
      const data = await res.json()

      if (!res.ok) {
        // 402 = not enough coins, 409 = hint limit reached
        setError(data.error ?? "Could not use hint.")
        return
      }

      // Pass the active hint up to the board component
      onHintTriggered({ type: hint.type, label: hint.label }, data.newBalance)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoadingHint(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Hints remaining counter */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Available</span>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            isExhausted
              ? "bg-muted text-muted-foreground"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {alreadyCompleted
            ? "Game complete"
            : isExhausted
            ? "None left"
            : `${hintsRemaining} of ${maxHints} left`}
        </span>
      </div>

      {/* Individual hint buttons */}
      {hints.map((hint) => (
        <button
          key={hint.type}
          onClick={() => handleHint(hint)}
          disabled={isExhausted || !!loadingHint}
          className="w-full text-left rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Hint name + coin cost */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">{hint.label}</span>
            <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">
              {loadingHint === hint.type ? "…" : `🪙 ${hint.coinCost}`}
            </span>
          </div>
          {/* Hint description */}
          <p className="text-xs text-muted-foreground leading-snug">
            {hint.description}
          </p>
        </button>
      ))}

      {/* Error message (insufficient coins, limit reached, etc.) */}
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded p-2 text-center">
          {error}
        </p>
      )}
    </div>
  )
}

// =============================================================
// MAIN PAGE COMPONENT
// =============================================================
export default function PlayGamePage() {
  // gameId comes from the URL: /play/[gameId]
  const { gameId } = useParams<{ gameId: string }>()
  const router = useRouter()

  // ---- Core game state ----
  const [game, setGame] = useState<GamePayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")

  // ---- Hint state ----
  // hintsUsed is tracked locally (starts from server value, increments on purchase)
  const [hintsUsed, setHintsUsed] = useState(0)
  // activeHint is passed to the board so it can apply the visual hint
  const [activeHint, setActiveHint] = useState<HintRequest | null>(null)
  // coinBalance updates after each hint purchase or game completion
  const [coinBalance, setCoinBalance] = useState<number | null>(null)

  // ---- Win state ----
  const [showWinOverlay, setShowWinOverlay] = useState(false)
  const [coinsAwarded, setCoinsAwarded] = useState(0)

  // Track how long the user has been playing (for the timeSpentSecs field)
  const startTime = useRef<number>(Date.now())

  // =============================================================
  // FETCH GAME DATA
  // On mount, request the full puzzle content from the gated API.
  // If the user doesn't have access (401/403), redirect appropriately.
  // =============================================================
  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/api/games/daily/${gameId}`)
        const data = await res.json()

        if (!res.ok) {
          if (res.status === 401) {
            // Not logged in — send to login
            router.push("/login")
            return
          }
          if (data.upsell) {
            // Pro game, free user — send to upgrade page
            router.push("/upgrade")
            return
          }
          setFetchError(data.error ?? "Failed to load game.")
          return
        }

        setGame(data)
        // Seed local hint count from server progress record
        setHintsUsed(data.progress.hintsUsed ?? 0)
      } catch {
        setFetchError("Could not connect to the server. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGame()
  }, [gameId, router])

  // =============================================================
  // HANDLE GAME COMPLETE
  // Called by the board component via onComplete() when the user
  // solves the puzzle. Posts to /api/coins/earn and shows the
  // win overlay on success.
  // =============================================================
  const handleComplete = useCallback(async () => {
    if (!game) return

    // Calculate time spent in seconds since the page loaded
    const elapsed = Math.floor((Date.now() - startTime.current) / 1000)

    try {
      const res = await fetch("/api/coins/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, timeSpentSecs: elapsed }),
      })
      const data = await res.json()

      if (res.ok) {
        // Show the win overlay with coins earned
        setCoinsAwarded(data.coinsAwarded)
        setCoinBalance(data.newBalance)
        setShowWinOverlay(true)
      }
      // 409 = already completed — user is replaying. Silently ignore.
      // They still solved it, just don't award coins twice.
    } catch {
      // Network error on completion — don't break the UI.
      // The user solved the puzzle; just don't show the overlay.
    }
  }, [game])

  // =============================================================
  // HANDLE HINT TRIGGERED
  // Called by HintPanel after a successful /api/coins/spend call.
  // Passes the active hint down to the board and updates balances.
  // =============================================================
  function handleHintTriggered(hint: HintRequest, newBalance: number) {
    setActiveHint(hint)
    setHintsUsed((n) => n + 1)
    setCoinBalance(newBalance)
  }

  // Called by the board after it has applied the hint visually.
  // Clears the active hint so it doesn't re-apply on re-render.
  function handleHintConsumed() {
    setActiveHint(null)
  }

  // =============================================================
  // LOADING STATE
  // =============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm animate-pulse">Loading game…</p>
      </div>
    )
  }

  // =============================================================
  // ERROR STATE
  // =============================================================
  if (fetchError || !game) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <p className="text-destructive">{fetchError || "Game not found."}</p>
        <Button asChild variant="outline">
          <Link href="/play">Back to Games</Link>
        </Button>
      </div>
    )
  }

  // Resolve the board component from the registry (or fall back to placeholder)
  const BoardComponent = getBoard(game.component)

  // Pull config from the manifest
  const manifestConfig = game.manifest?.config
  const hints = manifestConfig?.hints ?? []
  const maxHints = manifestConfig?.maxHintsPerGame ?? 0

  // Whether this user has already completed this game in a prior session
  const isAlreadyCompleted = game.progress.isCompleted

  // =============================================================
  // MAIN RENDER
  // Layout:
  //   Mobile:  Header → Board → Hint panel (stacked)
  //   Desktop: Header → [Board | Hint sidebar] (flex row)
  // =============================================================
  return (
    <>
      {/* Win overlay — rendered outside the layout so it covers everything */}
      {showWinOverlay && (
        <WinOverlay
          gameTypeDisplayName={game.gameTypeDisplayName}
          coinsAwarded={coinsAwarded}
          newBalance={coinBalance ?? 0}
          onClose={() => setShowWinOverlay(false)}
        />
      )}

      <div className="space-y-4">

        {/* ---- PAGE HEADER ---- */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">

            {/* Back button */}
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/play">← Back</Link>
            </Button>

            {/* Game title + meta */}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight truncate">
                {game.title ?? game.gameTypeDisplayName}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {game.gameTypeDisplayName}
                </span>
                {game.level && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted capitalize">
                    {game.level}
                  </span>
                )}
                {isAlreadyCompleted && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                    ✓ Completed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Live coin balance — appears after first hint or completion */}
          {coinBalance !== null && (
            <span className="shrink-0 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
              🪙 {coinBalance}
            </span>
          )}
        </div>

        {/* ---- GAME AREA ---- */}
        {/* On mobile: stacked (board above, hints below) */}
        {/* On desktop (lg:): board takes remaining width, hint panel is fixed right */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* Board — flexible width, fills available space */}
          <div className="w-full lg:flex-1 min-w-0">
            <BoardComponent
              gameData={game.gameData}
              gameTypeSlug={game.gameTypeSlug}
              level={game.level}
              onComplete={handleComplete}
              activeHint={activeHint}
              onHintConsumed={handleHintConsumed}
            />
          </div>

          {/* Hint panel — only shown if this game type has hints */}
          {hints.length > 0 && (
            <div className="w-full lg:w-64 lg:shrink-0">
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm">Hints</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <HintPanel
                    hints={hints}
                    hintsUsed={hintsUsed}
                    maxHints={maxHints}
                    gameId={game.id}
                    alreadyCompleted={isAlreadyCompleted}
                    onHintTriggered={handleHintTriggered}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
