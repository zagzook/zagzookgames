// =============================================================
// API ROUTE — POST /api/auth/register
// Creates a new user account with email and password.
// Hashes the password with bcrypt before storing.
// Automatically creates a FREE subscription record.
// =============================================================

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validate registration input
const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, email, password } = parsed.data

  // Check if this email is already registered
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json(
      { error: { email: ["An account with this email already exists"] } },
      { status: 409 }
    )
  }

  // Hash the password — bcrypt with cost factor 12
  // Higher cost = slower to crack but also slower to register (~300ms)
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create the user and their FREE subscription in one transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: { id: true, email: true, name: true },
    })

    // Every new user starts on the FREE tier
    await tx.subscription.create({
      data: {
        userId: newUser.id,
        tier: "FREE",
        status: "ACTIVE",
      },
    })

    return newUser
  })

  return NextResponse.json(
    { message: "Account created successfully", userId: user.id },
    { status: 201 }
  )
}
