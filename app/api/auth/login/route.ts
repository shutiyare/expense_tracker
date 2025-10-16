/**
 * ════════════════════════════════════════════════════════════════════════════
 * LOGIN API ROUTE - OPTIMIZED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Performance Optimizations:
 * ✅ Optimized database connection (connection pooling)
 * ✅ Lean query with specific field selection
 * ✅ Performance tracking and structured logging
 * ✅ Comprehensive error handling
 * ✅ Input validation and sanitization
 * ✅ Secure password comparison
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectDB from "@/lib/dbConnect";
import { signToken } from "@/lib/auth";
import { logger, trackPerformance } from "@/lib/logger";

export async function POST(req: Request) {
  const track = trackPerformance("POST /api/auth/login", "api");

  try {
    // 1. PARSE AND VALIDATE INPUT
    const { email, password } = await req.json();

    // Input validation
    if (!email?.trim() || !password) {
      track.end({ status: 400, reason: "missing_credentials" });
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      track.end({ status: 400, reason: "invalid_email_format" });
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // 2. DATABASE CONNECTION
    await connectDB();

    // 3. FIND USER WITH OPTIMIZED QUERY
    // Use lean() for performance and explicitly select passwordHash
    const user: any = await User.findOne({
      email: email.toLowerCase().trim(),
    })
      .select("+passwordHash name email currency")
      .lean()
      .exec();

    if (!user) {
      track.end({ status: 401, reason: "user_not_found" });
      logger.warn("Login attempt with non-existent email", { email });
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 4. VERIFY PASSWORD
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      track.end({ status: 401, reason: "invalid_password" });
      logger.warn("Failed login attempt", {
        email: user.email,
        userId: user._id,
      });
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 5. GENERATE JWT TOKEN
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // 6. LOG SUCCESS AND RETURN
    const duration = track.end({
      userId: user._id.toString(),
      email: user.email,
    });

    logger.info("User logged in successfully", {
      userId: user._id.toString(),
      email: user.email,
      duration,
    });

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
    });
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Login error", error, {
      email: req.headers.get("user-agent"),
    });

    return NextResponse.json(
      {
        message: "Login failed",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
