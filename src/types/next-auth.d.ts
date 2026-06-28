// =============================================================
// AUTH.JS TYPE EXTENSIONS
// Extends the default NextAuth session and JWT types to include
// our app-specific fields: user ID and subscription tier.
// Without this, TypeScript won't know these fields exist on
// session.user and the JWT token.
// =============================================================

import { DefaultSession } from "next-auth"

// Extend the built-in Session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string                  // user's database ID (cuid)
      tier: "FREE" | "PRO"        // subscription tier from our DB
    } & DefaultSession["user"]    // keep default fields: name, email, image
  }
}

// Extend the built-in JWT type (the token stored in the cookie)
declare module "next-auth/jwt" {
  interface JWT {
    id: string          // user's database ID
    tier: "FREE" | "PRO" // subscription tier cached in the token
  }
}
