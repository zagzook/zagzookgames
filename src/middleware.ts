// =============================================================
// NEXT.JS MIDDLEWARE — Route Protection
// Runs on every matched request BEFORE the page renders.
// Responsibilities:
//   1. Redirect unauthenticated users away from protected routes
//   2. Redirect authenticated users away from auth pages (login)
//
// NOTE: Middleware only checks "is user logged in?"
//       Tier checks (FREE vs PRO) happen inside API routes and
//       server components — never here. Middleware is not the
//       right place for subscription-level access control.
// =============================================================

import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Routes that require the user to be logged in
const PROTECTED_ROUTES = [
  "/dashboard",
  "/play",
  "/booklets",
  "/profile",
  "/settings",
]

// Routes that logged-in users should not access
// (redirects them to dashboard instead)
const AUTH_ROUTES = ["/login", "/register"]

// Admin routes — require login AND we do a tier/role check
// in the actual page component, not here
const ADMIN_ROUTES = ["/admin"]

// Auth.js v5 middleware: req is augmented with req.auth (Session | null)
export default auth((req) => {
  const { nextUrl } = req
  // req.auth is null when not logged in, Session object when logged in
  const isLoggedIn = !!req.auth

  const isProtected = PROTECTED_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  )
  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  )

  // Admin routes: redirect to login if not authenticated
  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // Protected routes: redirect to login if not authenticated
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl)
    // Preserve the intended destination so we can redirect after login
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Auth routes: redirect to dashboard if already logged in
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  // All other routes: allow through
  return NextResponse.next()
})

// Tell Next.js which routes this middleware should run on.
// Excludes static files, images, and API routes to avoid
// unnecessary middleware overhead.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
