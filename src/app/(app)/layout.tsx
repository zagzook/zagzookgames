// =============================================================
// MAIN APP LAYOUT
// Wraps all authenticated app pages (dashboard, play, booklets).
// Contains the top navigation bar with user info and coin balance.
// =============================================================

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getUserCoinBalance } from "@/lib/coins"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // All app pages require authentication
  const session = await auth()
  if (!session?.user) redirect("/login")

  const coinBalance = await getUserCoinBalance(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <Link href="/dashboard" className="font-bold text-lg tracking-tight">
            Zagzook Games
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/play" className="text-muted-foreground hover:text-foreground transition-colors">
              Daily Games
            </Link>
            <Link href="/booklets" className="text-muted-foreground hover:text-foreground transition-colors">
              Booklets
            </Link>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4 text-sm">
            {/* Coin Balance */}
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
              <span>🪙</span>
              <span className="font-semibold">{coinBalance.toLocaleString()}</span>
            </div>

            {/* Tier Badge */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              session.user.tier === "PRO"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-muted text-muted-foreground"
            }`}>
              {session.user.tier}
            </span>

            {/* Profile Link */}
            <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
              {session.user.name ?? session.user.email}
            </Link>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
