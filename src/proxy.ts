// =============================================================
// NEXT.JS PROXY (formerly middleware.ts — renamed in Next.js 16)
// Runs on every matched request BEFORE the page renders.
// Responsibilities:
//   1. Redirect unauthenticated users away from protected routes
//   2. Redirect authenticated users away from auth pages (login)
//
// NOTE: Proxy only checks "is user logged in?"
//       Tier checks (FREE vs PRO) happen inside API routes and
//       server components — never here.
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

// Admin routes — require login; tier/role check happens in the page itself
const ADMIN_ROUTES = ["/admin"]

// Auth.js v5: req is augmented with req.auth (Session | null)
export default auth((req) => {
  const { nextUrl } = req
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
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Auth routes: redirect to dashboard if already logged in
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

// Tell Next.js which routes this proxy should run on
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
