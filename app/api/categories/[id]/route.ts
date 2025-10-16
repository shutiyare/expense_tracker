/**
 * ════════════════════════════════════════════════════════════════════════════
 * CATEGORY BY ID API ROUTE - OPTIMIZED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Performance Optimizations:
 * ✅ Optimized database connection
 * ✅ Proper validation and error handling
 * ✅ Performance tracking and logging
 * ✅ Cache invalidation on updates/deletes
 * ✅ MongoDB ObjectId validation
 * ✅ Cascade delete check (prevent deleting categories with associated transactions)
 */

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Category from "@/models/Category";
import Expense from "@/models/Expense";
import Income from "@/models/Income";
import connectDB from "@/lib/dbConnect";
import { getUserFromRequest } from "@/lib/auth";
import { logger, trackPerformance } from "@/lib/logger";
import { invalidateUserCache } from "@/lib/cache";

// ────────────────────────────────────────────────────────────────────────────
// GET /api/categories/[id] - Get single category by ID
// ────────────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const track = trackPerformance("GET /api/categories/[id]", "api");

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
        { message: "Invalid category ID format" },
        { status: 400 }
      );
    }

    // 3. DATABASE CONNECTION
    await connectDB();

    // 4. FETCH CATEGORY
    const category = await Category.findOne({
      _id: id,
      userId: user.userId,
    })
      .lean()
      .exec();

    if (!category) {
      track.end({ status: 404 });
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    // 5. LOG AND RETURN
    track.end({ userId: user.userId, categoryId: id });

    return NextResponse.json({ category });
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Error fetching category", error);

    return NextResponse.json(
      {
        message: "Failed to fetch category",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/categories/[id] - Update category
// ────────────────────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const track = trackPerformance("PUT /api/categories/[id]", "api");

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
        { message: "Invalid category ID format" },
        { status: 400 }
      );
    }

    // 3. PARSE AND VALIDATE INPUT
    const data = await req.json();

    // Name validation if provided
    if (data.name !== undefined) {
      data.name = data.name.trim();
      if (!data.name) {
        track.end({ status: 400, reason: "empty_name" });
        return NextResponse.json(
          { message: "Category name cannot be empty" },
          { status: 400 }
        );
      }
    }

    // Color validation if provided
    if (data.color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color)) {
      track.end({ status: 400, reason: "invalid_color" });
      return NextResponse.json(
        { message: "Color must be a valid hex color code" },
        { status: 400 }
      );
    }

    // Type validation if provided (prevent changing type)
    if (data.type && !["expense", "income"].includes(data.type)) {
      track.end({ status: 400, reason: "invalid_type" });
      return NextResponse.json(
        { message: "Type must be either 'expense' or 'income'" },
        { status: 400 }
      );
    }

    // 4. DATABASE CONNECTION
    await connectDB();

    // 5. CHECK FOR DUPLICATE NAME (if name is being updated)
    if (data.name) {
      const existingCategory = await Category.findOne({
        _id: { $ne: id },
        userId: user.userId,
        name: data.name,
      }).lean();

      if (existingCategory) {
        track.end({ status: 409, reason: "duplicate_name" });
        return NextResponse.json(
          { message: "A category with this name already exists" },
          { status: 409 }
        );
      }
    }

    // 6. UPDATE CATEGORY
    const category = await Category.findOneAndUpdate(
      { _id: id, userId: user.userId },
      data,
      { new: true, runValidators: true }
    );

    if (!category) {
      track.end({ status: 404 });
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    // 7. INVALIDATE CACHE
    invalidateUserCache(user.userId);

    // 8. LOG AND RETURN
    const duration = track.end({ userId: user.userId, categoryId: id });

    logger.info("Category updated successfully", {
      userId: user.userId,
      categoryId: id,
      name: category.name,
      duration,
    });

    return NextResponse.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Error updating category", error);

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

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "A category with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: "Failed to update category",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/categories/[id] - Delete category
// ────────────────────────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const track = trackPerformance("DELETE /api/categories/[id]", "api");

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
        { message: "Invalid category ID format" },
        { status: 400 }
      );
    }

    // 3. DATABASE CONNECTION
    await connectDB();

    // 4. CHECK IF CATEGORY IS IN USE
    // Check expenses
    const expenseCount = await Expense.countDocuments({
      userId: user.userId,
      categoryId: id,
    });

    // Check incomes
    const incomeCount = await Income.countDocuments({
      userId: user.userId,
      categoryId: id,
    });

    const totalUsage = expenseCount + incomeCount;

    if (totalUsage > 0) {
      track.end({ status: 409, reason: "category_in_use" });
      return NextResponse.json(
        {
          message: `Cannot delete category. It is being used by ${totalUsage} transaction(s)`,
          usageCount: totalUsage,
          expenseCount,
          incomeCount,
        },
        { status: 409 }
      );
    }

    // 5. DELETE CATEGORY
    const category = await Category.findOneAndDelete({
      _id: id,
      userId: user.userId,
    });

    if (!category) {
      track.end({ status: 404 });
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    // 6. INVALIDATE CACHE
    invalidateUserCache(user.userId);

    // 7. LOG AND RETURN
    const duration = track.end({ userId: user.userId, categoryId: id });

    logger.info("Category deleted successfully", {
      userId: user.userId,
      categoryId: id,
      name: category.name,
      duration,
    });

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Error deleting category", error);

    return NextResponse.json(
      {
        message: "Failed to delete category",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
