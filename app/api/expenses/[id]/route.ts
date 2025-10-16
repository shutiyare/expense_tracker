/**
 * ════════════════════════════════════════════════════════════════════════════
 * EXPENSE BY ID API ROUTE - OPTIMIZED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Performance Optimizations:
 * ✅ Optimized database connection
 * ✅ Field projection with populate
 * ✅ Proper validation and error handling
 * ✅ Performance tracking and logging
 * ✅ Cache invalidation on updates/deletes
 * ✅ MongoDB ObjectId validation
 */

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Expense from "@/models/Expense";
import Category from "@/models/Category";
import connectDB from "@/lib/dbConnect";
import { getUserFromRequest } from "@/lib/auth";
import { logger, trackPerformance } from "@/lib/logger";
import { invalidateUserCache } from "@/lib/cache";

// ────────────────────────────────────────────────────────────────────────────
// GET /api/expenses/[id] - Get single expense by ID
// ────────────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const track = trackPerformance("GET /api/expenses/[id]", "api");

  try {
    // 1. AUTHENTICATION
    const user = getUserFromRequest(req);
    if (!user) {
      track.end({ status: 401 });
      return NextResponse.json(
        { message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 2. VALIDATE OBJECT ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      track.end({ status: 400, reason: "invalid_id" });
      return NextResponse.json(
        { message: "Invalid expense ID format" },
        { status: 400 }
      );
    }

    // 3. DATABASE CONNECTION
    await connectDB();

    // 4. FETCH EXPENSE
    const expense = await Expense.findOne({
      _id: id,
      userId: user.userId, // Ensure user owns this expense
    })
      .populate("categoryId", "name color icon")
      .lean() // Return plain JS object (faster)
      .exec();

    if (!expense) {
      track.end({ status: 404 });
      return NextResponse.json(
        { message: "Expense not found" },
        { status: 404 }
      );
    }

    // 5. LOG AND RETURN
    track.end({ userId: user.userId, expenseId: id });

    return NextResponse.json({ expense });
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Error fetching expense", error);

    return NextResponse.json(
      {
        message: "Failed to fetch expense",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/expenses/[id] - Update expense
// ────────────────────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const track = trackPerformance("PUT /api/expenses/[id]", "api");

  try {
    // 1. AUTHENTICATION
    const user = getUserFromRequest(req);
    if (!user) {
      track.end({ status: 401 });
      return NextResponse.json(
        { message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 2. VALIDATE OBJECT ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      track.end({ status: 400, reason: "invalid_id" });
      return NextResponse.json(
        { message: "Invalid expense ID format" },
        { status: 400 }
      );
    }

    // 3. PARSE AND VALIDATE INPUT
    const data = await req.json();

    // Amount validation if provided
    if (data.amount !== undefined) {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount < 0) {
        track.end({ status: 400, reason: "invalid_amount" });
        return NextResponse.json(
          { message: "Amount must be a positive number" },
          { status: 400 }
        );
      }
      if (amount > 1000000000) {
        track.end({ status: 400, reason: "amount_too_large" });
        return NextResponse.json(
          { message: "Amount exceeds maximum allowed value" },
          { status: 400 }
        );
      }
      data.amount = amount;
    }

    // Title validation if provided
    if (data.title !== undefined) {
      data.title = data.title.trim();
      if (!data.title) {
        track.end({ status: 400, reason: "empty_title" });
        return NextResponse.json(
          { message: "Title cannot be empty" },
          { status: 400 }
        );
      }
    }

    // Notes sanitization if provided
    if (data.notes !== undefined) {
      data.notes = data.notes.trim();
    }

    // 4. DATABASE CONNECTION
    await connectDB();

    // 5. VALIDATE CATEGORY IF PROVIDED
    if (data.categoryId) {
      const categoryExists = await Category.exists({
        _id: data.categoryId,
        userId: user.userId,
        type: "expense",
      });

      if (!categoryExists) {
        track.end({ status: 400, reason: "invalid_category" });
        return NextResponse.json(
          { message: "Invalid category ID" },
          { status: 400 }
        );
      }
    }

    // 6. UPDATE EXPENSE
    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: user.userId },
      data,
      { new: true, runValidators: true }
    ).populate("categoryId", "name color icon");

    if (!expense) {
      track.end({ status: 404 });
      return NextResponse.json(
        { message: "Expense not found" },
        { status: 404 }
      );
    }

    // 7. INVALIDATE CACHE
    invalidateUserCache(user.userId);

    // 8. LOG AND RETURN
    const duration = track.end({ userId: user.userId, expenseId: id });

    logger.info("Expense updated successfully", {
      userId: user.userId,
      expenseId: id,
      duration,
    });

    return NextResponse.json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Error updating expense", error);

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
        message: "Failed to update expense",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/expenses/[id] - Delete expense
// ────────────────────────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const track = trackPerformance("DELETE /api/expenses/[id]", "api");

  try {
    // 1. AUTHENTICATION
    const user = getUserFromRequest(req);
    if (!user) {
      track.end({ status: 401 });
      return NextResponse.json(
        { message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 2. VALIDATE OBJECT ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      track.end({ status: 400, reason: "invalid_id" });
      return NextResponse.json(
        { message: "Invalid expense ID format" },
        { status: 400 }
      );
    }

    // 3. DATABASE CONNECTION
    await connectDB();

    // 4. DELETE EXPENSE
    const expense = await Expense.findOneAndDelete({
      _id: id,
      userId: user.userId,
    });

    if (!expense) {
      track.end({ status: 404 });
      return NextResponse.json(
        { message: "Expense not found" },
        { status: 404 }
      );
    }

    // 5. INVALIDATE CACHE
    invalidateUserCache(user.userId);

    // 6. LOG AND RETURN
    const duration = track.end({ userId: user.userId, expenseId: id });

    logger.info("Expense deleted successfully", {
      userId: user.userId,
      expenseId: id,
      amount: expense.amount,
      duration,
    });

    return NextResponse.json({
      message: "Expense deleted successfully",
    });
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Error deleting expense", error);

    return NextResponse.json(
      {
        message: "Failed to delete expense",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
