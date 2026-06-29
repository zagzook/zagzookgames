// =============================================================
// DAILY PLAY PAGE — /play
// Shows today's game lobby — all games scheduled for today.
// Free games are playable by all. Pro games show a lock for
// free members with an upsell prompt.
// =============================================================

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Shape of each game stub returned by /api/games/daily
interface GameStub {
  id: string
  gameTypeSlug: string
  gameTypeDisplayName: string
  tier: "FREE" | "PRO"
  level: string | null
  title: string | null
  scheduledDate: string
  isLocked: boolean
  isCompleted: boolean
}

// Color per difficulty level
const LEVEL_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
}

export default function PlayPage() {
  const [games, setGames] = useState<GameStub[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [date] = useState(() => new Date().toISOString().split("T")[0]) // today

  useEffect(() => {
    async function fetchLobby() {
      try {
        const res = await fetch(`/api/games/daily?date=${date}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? "Failed to load today's games.")
          return
        }

        setGames(data.games)
      } catch {
        setError("Could not connect to the server. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLobby()
  }, [date])

  // Format date for display
  const displayDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  // Group games by game type for cleaner display
  const groupedGames = games.reduce<Record<string, GameStub[]>>((acc, game) => {
    const key = game.gameTypeDisplayName
    if (!acc[key]) acc[key] = []
    acc[key].push(game)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Daily Games</h1>
        <p className="text-muted-foreground mt-1">{displayDate}</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Empty State — no games scheduled yet */}
      {!isLoading && !error && games.length === 0 && (
        <Card className="text-center py-16">
          <CardContent>
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-xl font-semibold mb-2">No games today yet</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Daily games are scheduled by the admin. Check back soon or
              browse the game booklets if you&apos;re a Pro member.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Game Lobby — grouped by game type */}
      {!isLoading && !error && Object.entries(groupedGames).map(([gameTypeName, typeGames]) => (
        <div key={gameTypeName}>
          <h2 className="text-xl font-semibold mb-4">{gameTypeName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeGames.map((game) => (
              <GameTile key={game.id} game={game} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Individual game tile component
function GameTile({ game }: { game: GameStub }) {
  const levelColor = LEVEL_COLORS[game.level ?? ""] ?? "bg-muted text-muted-foreground"

  // Completed state
  if (game.isCompleted) {
    return (
      <Card className="border-green-200 bg-green-50/30 opacity-80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${levelColor}`}>
              {game.level ?? "puzzle"}
            </span>
            <span className="text-green-600 text-sm font-medium">✓ Done</span>
          </div>
          <CardTitle className="text-base mt-2">
            {game.title ?? game.gameTypeDisplayName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" className="w-full" disabled>
            Completed
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Locked (Pro game, free user)
  if (game.isLocked) {
    return (
      <Card className="border-yellow-200 bg-yellow-50/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${levelColor}`}>
              {game.level ?? "puzzle"}
            </span>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
              ⭐ PRO
            </span>
          </div>
          <CardTitle className="text-base mt-2">
            {game.title ?? game.gameTypeDisplayName}
          </CardTitle>
          <CardDescription className="text-xs">Pro members only</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
            <Link href="/upgrade">Unlock with Pro</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Available to play
  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${levelColor}`}>
            {game.level ?? "puzzle"}
          </span>
          {game.tier === "PRO" && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
              ⭐ PRO
            </span>
          )}
        </div>
        <CardTitle className="text-base mt-2">
          {game.title ?? game.gameTypeDisplayName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button asChild size="sm" className="w-full">
          {/* /play/[gameId] will be the game player — built in the next step */}
          <Link href={`/play/${game.id}`}>Play</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
