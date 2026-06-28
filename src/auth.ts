// =============================================================
// AUTH.JS CONFIGURATION (NextAuth v5 / Auth.js)
// Handles all authentication for Zagzook Games:
//   - Email/password login (credentials provider)
//   - Google OAuth login (optional, requires env vars)
//   - JWT sessions with subscription tier embedded
//   - Automatic FREE subscription record on first sign-up
// =============================================================

import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Use Prisma to store OAuth accounts and user records
  adapter: PrismaAdapter(prisma),

  // JWT strategy: subscription tier is embedded in the token so
  // we don't need a DB lookup on every request to check tier.
  // The token is refreshed periodically to pick up plan changes.
  session: { strategy: "jwt" },

  providers: [
    // ----------------------------------------------------------
    // CREDENTIALS PROVIDER — Email + Password
    // bcrypt verifies the password against the stored hash.
    // We never store plaintext passwords.
    // ----------------------------------------------------------
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate that both fields were provided
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Look up the user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            subscription: true, // fetch tier at login time
          },
        })

        // User not found, or signed up via OAuth (no password)
        if (!user || !user.password) {
          return null
        }

        // Compare the provided password against the stored bcrypt hash
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) {
          return null
        }

        // Return the user object — Auth.js puts this into the JWT
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),

    // ----------------------------------------------------------
    // GOOGLE OAUTH PROVIDER
    // Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
    // Leave this in — it's inactive until those vars are set.
    // ----------------------------------------------------------
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    // ----------------------------------------------------------
    // JWT CALLBACK
    // Runs when a JWT token is created or refreshed.
    // We embed the user's ID and subscription tier in the token
    // so downstream code never needs a DB call to check tier.
    // ----------------------------------------------------------
    async jwt({ token, user }) {
      if (user) {
        // First sign-in: embed the user ID from the DB record
        token.id = user.id as string

        // Fetch the subscription tier and cache it in the JWT
        const subscription = await prisma.subscription.findUnique({
          where: { userId: user.id as string },
        })
        token.tier = (subscription?.tier ?? "FREE") as "FREE" | "PRO"
      }
      return token
    },

    // ----------------------------------------------------------
    // SESSION CALLBACK
    // Runs whenever session() is called (server components, API).
    // Maps values from the JWT token onto the session object.
    // This is what your app code reads via auth() or useSession().
    // ----------------------------------------------------------
    async session({ session, token }) {
      if (token && session.user) {
        // Cast required: our JWT type extension is declared in
        // src/types/next-auth.d.ts but TypeScript needs explicit
        // assertions here due to how Auth.js merges its internal types
        session.user.id = token.id as string
        session.user.tier = token.tier as "FREE" | "PRO"
      }
      return session
    },
  },

  // ----------------------------------------------------------
  // EVENT: User created
  // When a new user signs up (credentials or OAuth), automatically
  // create a FREE subscription record for them.
  // This ensures every user always has a subscription row.
  // ----------------------------------------------------------
  events: {
    async createUser({ user }) {
      await prisma.subscription.create({
        data: {
          userId: user.id as string,
          tier: "FREE",
          status: "ACTIVE",
        },
      })
    },
  },

  // Custom pages — we'll build these in the UI steps
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
