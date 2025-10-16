/**
 * ════════════════════════════════════════════════════════════════════════════
 * REGISTER API ROUTE - OPTIMIZED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Performance Optimizations:
 * ✅ Optimized database connection (connection pooling)
 * ✅ Lean queries for duplicate check
 * ✅ Bulk insert for default categories
 * ✅ Performance tracking and structured logging
 * ✅ Comprehensive input validation
 * ✅ Secure password hashing (bcrypt with 10 rounds)
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import Category from "@/models/Category";
import connectDB from "@/lib/dbConnect";
import {
  defaultExpenseCategories,
  defaultIncomeCategories,
} from "@/lib/default-categories";
import { logger, trackPerformance } from "@/lib/logger";

export async function POST(req: Request) {
  const track = trackPerformance("POST /api/auth/register", "api");

  try {
    // 1. PARSE AND VALIDATE INPUT
    const { name, email, password, currency } = await req.json();

    // Required field validation
    if (!name?.trim()) {
      track.end({ status: 400, reason: "missing_name" });
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      track.end({ status: 400, reason: "missing_email" });
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    if (!password) {
      track.end({ status: 400, reason: "missing_password" });
      return NextResponse.json(
        { message: "Password is required" },
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

    // Password strength validation
    if (password.length < 6) {
      track.end({ status: 400, reason: "weak_password" });
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      track.end({ status: 400, reason: "password_too_long" });
      return NextResponse.json(
        { message: "Password cannot exceed 128 characters" },
        { status: 400 }
      );
    }

    // Name validation
    if (name.length > 100) {
      track.end({ status: 400, reason: "name_too_long" });
      return NextResponse.json(
        { message: "Name cannot exceed 100 characters" },
        { status: 400 }
      );
    }

    // 2. DATABASE CONNECTION
    await connectDB();

    // 3. CHECK IF USER EXISTS (optimized with lean and only _id)
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    })
      .select("_id")
      .lean()
      .exec();

    if (existingUser) {
      track.end({ status: 409, reason: "user_exists" });
      logger.warn("Registration attempt with existing email", { email });
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // 4. HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. CREATE NEW USER
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      currency: currency?.toUpperCase() || "USD",
    });

    // 6. CREATE DEFAULT CATEGORIES (bulk insert for performance)
    const expenseCategories = defaultExpenseCategories.map((cat) => ({
      ...cat,
      userId: newUser._id,
    }));

    const incomeCategories = defaultIncomeCategories.map((cat) => ({
      ...cat,
      userId: newUser._id,
    }));

    // Bulk insert all categories at once
    await Category.insertMany([...expenseCategories, ...incomeCategories], {
      ordered: false, // Continue on error
    });

    // 7. LOG SUCCESS AND RETURN
    const duration = track.end({
      userId: newUser._id.toString(),
      email: newUser.email,
      categoriesCreated: expenseCategories.length + incomeCategories.length,
    });

    logger.info("User registered successfully", {
      userId: newUser._id.toString(),
      email: newUser.email,
      duration,
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          currency: newUser.currency,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Registration error", error);

    // Handle duplicate key error (should not happen after check, but just in case)
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: Object.values(error.errors).map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Registration failed",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
