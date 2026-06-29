// =============================================================
// AUTH LAYOUT
// Wraps login and register pages with a centered, full-height
// layout featuring the Zagzook Games brand at the top.
// =============================================================

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Brand header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Zagzook Games
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Daily puzzles. Pro challenges. Your way.
        </p>
      </div>

      {/* Page content (login or register card) */}
      {children}

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Zagzook Games. All rights reserved.
      </p>
    </div>
  )
}
