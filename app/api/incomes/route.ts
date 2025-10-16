/**
 * ════════════════════════════════════════════════════════════════════════════
 * INCOMES API ROUTE - OPTIMIZED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Performance Optimizations:
 * ✅ Optimized database connection (reuses existing connection)
 * ✅ Pagination with proper limits
 * ✅ Field projection (only fetch needed data)
 * ✅ Query optimization with lean()
 * ✅ Performance tracking and logging
 * ✅ Proper error handling with context
 * ✅ Input validation and sanitization
 * ✅ Cache invalidation on writes
 */

import { NextRequest, NextResponse } from "next/server";
import Income from "@/models/Income";
import Category from "@/models/Category";
import connectDB from "@/lib/dbConnect";
import { getUserFromRequest } from "@/lib/auth";
import { logger, trackPerformance } from "@/lib/logger";
import { paginate, buildDateRangeFilter } from "@/lib/queryHelpers";
import { invalidateUserCache } from "@/lib/cache";

// ────────────────────────────────────────────────────────────────────────────
// GET /api/incomes - List user incomes with filters and pagination
// ────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const track = trackPerformance("GET /api/incomes", "api");

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

    // 2. DATABASE CONNECTION
    await connectDB();

    // 3. EXTRACT QUERY PARAMETERS
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryId = searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // 4. BUILD OPTIMIZED QUERY
    const filter: any = { userId: user.userId };

    // Apply date range filter
    if (startDate || endDate) {
      const dateFilter = buildDateRangeFilter(
        {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
        "date"
      );
      Object.assign(filter, dateFilter);
    }

    // Apply category filter
    if (categoryId && categoryId !== "all") {
      filter.categoryId = categoryId;
    }

    // 5. EXECUTE PAGINATED QUERY
    const result = await paginate(
      Income.find(filter).populate("categoryId", "name color icon"),
      {
        page,
        limit: Math.min(limit, 100), // Max 100 items per page
        sortBy: "date",
        sortOrder: "desc",
      }
    );

    // 6. LOG AND RETURN
    const duration = track.end({
      userId: user.userId,
      total: result.pagination.total,
      page,
    });

    logger.info("Incomes fetched successfully", {
      userId: user.userId,
      count: result.data.length,
      duration,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Error fetching incomes", error, {
      userId: req.headers.get("authorization"),
    });

    return NextResponse.json(
      {
        message: "Failed to fetch incomes",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/incomes - Create new income
// ────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const track = trackPerformance("POST /api/incomes", "api");

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

    // 2. PARSE AND VALIDATE INPUT
    const data = await req.json();

    // Required field validation
    if (!data.title?.trim()) {
      track.end({ status: 400, reason: "missing_title" });
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }

    if (data.amount === undefined || data.amount === null) {
      track.end({ status: 400, reason: "missing_amount" });
      return NextResponse.json(
        { message: "Amount is required" },
        { status: 400 }
      );
    }

    // Amount validation
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

    // 3. DATABASE CONNECTION
    await connectDB();

    // 4. VALIDATE CATEGORY IF PROVIDED
    if (data.categoryId) {
      const categoryExists = await Category.exists({
        _id: data.categoryId,
        userId: user.userId,
        type: "income",
      });

      if (!categoryExists) {
        track.end({ status: 400, reason: "invalid_category" });
        return NextResponse.json(
          { message: "Invalid category ID" },
          { status: 400 }
        );
      }
    }

    // 5. CREATE INCOME
    const income = await Income.create({
      userId: user.userId,
      title: data.title.trim(),
      amount,
      categoryId: data.categoryId || null,
      source: data.source || "other",
      date: data.date ? new Date(data.date) : new Date(),
      notes: data.notes?.trim() || "",
    });

    // 6. POPULATE CATEGORY
    await income.populate("categoryId", "name color icon");

    // 7. INVALIDATE CACHE
    invalidateUserCache(user.userId);

    // 8. LOG AND RETURN
    const duration = track.end({
      userId: user.userId,
      incomeId: income._id.toString(),
    });

    logger.info("Income created successfully", {
      userId: user.userId,
      incomeId: income._id,
      amount,
      duration,
    });

    return NextResponse.json(
      {
        message: "Income created successfully",
        income,
      },
      { status: 201 }
    );
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Error creating income", error, {
      userId: req.headers.get("authorization"),
    });

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
        message: "Failed to create income",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
