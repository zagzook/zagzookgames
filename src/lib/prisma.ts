// =============================================================
// PRISMA CLIENT SINGLETON
// In Next.js development, hot-reloading creates new module
// instances on every reload. Without this singleton pattern,
// each reload would open a new database connection, eventually
// exhausting the Neon connection pool.
// In production, module-level code only runs once — no issue.
// =============================================================

// Prisma v6: client is generated to @prisma/client by default
import { PrismaClient } from "@prisma/client"

// Extend the global object type to hold our prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  // Reuse existing instance if it exists (development hot-reload)
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      // Log queries in development for debugging, errors only in production
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

// In non-production environments, cache the client on the global object
// so hot-reloads reuse it instead of creating a new connection
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
