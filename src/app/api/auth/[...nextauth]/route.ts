// =============================================================
// AUTH.JS API ROUTE HANDLER
// This single file handles ALL auth API requests:
//   GET/POST /api/auth/signin
//   GET/POST /api/auth/signout
//   GET/POST /api/auth/callback/*  (OAuth callbacks)
//   GET      /api/auth/session
//   GET      /api/auth/csrf
// Auth.js v5 exports named GET and POST handlers.
// =============================================================

// Import the handlers object from our auth config.
// Auth.js v5 returns { handlers, signIn, signOut, auth } from NextAuth().
// handlers.GET and handlers.POST are the Next.js route handler functions.
import { handlers } from "@/auth"

// Export named GET and POST so Next.js App Router recognises this
// file as an API route that handles both GET and POST requests.
export const { GET, POST } = handlers
