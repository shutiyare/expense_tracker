/**
 * ════════════════════════════════════════════════════════════════════════════
 * CATEGORIES API ROUTE - OPTIMIZED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Performance Optimizations:
 * ✅ LRU cache for category lists (categories rarely change)
 * ✅ Optimized database queries with lean()
 * ✅ Field projection (only fetch needed data)
 * ✅ Performance tracking and logging
 * ✅ Proper error handling
 * ✅ Cache invalidation on writes
 *
 * Cache Strategy:
 * - Categories are cached per user and type
 * - Cache TTL: 10 minutes (categories rarely change)
 * - Cache invalidated on POST/PUT/DELETE operations
 */

import { NextRequest, NextResponse } from "next/server";
import Category from "@/models/Category";
import connectDB from "@/lib/dbConnect";
import { getUserFromRequest } from "@/lib/auth";
import { logger, trackPerformance } from "@/lib/logger";
import {
  categoriesCache,
  generateCacheKey,
  invalidateUserCache,
} from "@/lib/cache";

// ────────────────────────────────────────────────────────────────────────────
// GET /api/categories - List user categories (with caching)
// ────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const track = trackPerformance("GET /api/categories", "api");

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

    // 2. EXTRACT QUERY PARAMETERS
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type"); // 'expense' or 'income' or null (all)

    // 3. CHECK CACHE
    const cacheKey = generateCacheKey(user.userId, "categories", type || "all");

    const cached = categoriesCache.get(cacheKey);
    if (cached) {
      track.end({ userId: user.userId, cached: true, count: cached.length });
      logger.debug("Categories fetched from cache", {
        userId: user.userId,
        type: type || "all",
        count: cached.length,
      });

      return NextResponse.json({ categories: cached, cached: true });
    }

    // 4. CACHE MISS - FETCH FROM DATABASE
    await connectDB();

    const filter: any = { userId: user.userId };
    if (type && (type === "expense" || type === "income")) {
      filter.type = type;
    }

    // Optimized query with lean() for read-only data
    const categories = await Category.find(filter)
      .select("name type color icon") // Only fetch needed fields
      .sort({ name: 1 })
      .lean() // Return plain JS objects (60% faster)
      .exec();

    // 5. STORE IN CACHE
    categoriesCache.set(cacheKey, categories, 10 * 60 * 1000); // 10 minutes TTL

    // 6. LOG AND RETURN
    const duration = track.end({
      userId: user.userId,
      cached: false,
      count: categories.length,
    });

    logger.info("Categories fetched from database", {
      userId: user.userId,
      type: type || "all",
      count: categories.length,
      duration,
    });

    return NextResponse.json({ categories, cached: false });
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Error fetching categories", error, {
      userId: req.headers.get("authorization"),
    });

    return NextResponse.json(
      {
        message: "Failed to fetch categories",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/categories - Create new category
// ────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const track = trackPerformance("POST /api/categories", "api");

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
    if (!data.name?.trim()) {
      track.end({ status: 400, reason: "missing_name" });
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    if (!data.type) {
      track.end({ status: 400, reason: "missing_type" });
      return NextResponse.json(
        { message: "Category type is required" },
        { status: 400 }
      );
    }

    if (!["expense", "income"].includes(data.type)) {
      track.end({ status: 400, reason: "invalid_type" });
      return NextResponse.json(
        { message: "Type must be either 'expense' or 'income'" },
        { status: 400 }
      );
    }

    // Color validation (optional)
    if (data.color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color)) {
      track.end({ status: 400, reason: "invalid_color" });
      return NextResponse.json(
        { message: "Color must be a valid hex color code" },
        { status: 400 }
      );
    }

    // 3. DATABASE CONNECTION
    await connectDB();

    // 4. CHECK FOR DUPLICATE CATEGORY NAME
    const existingCategory = await Category.findOne({
      userId: user.userId,
      name: data.name.trim(),
      type: data.type,
    }).lean();

    if (existingCategory) {
      track.end({ status: 409, reason: "duplicate_name" });
      return NextResponse.json(
        { message: "A category with this name already exists" },
        { status: 409 }
      );
    }

    // 5. CREATE CATEGORY
    const category = await Category.create({
      userId: user.userId,
      name: data.name.trim(),
      type: data.type,
      color: data.color || "#6366f1",
      icon: data.icon || "📁",
    });

    // 6. INVALIDATE CACHE
    invalidateUserCache(user.userId);

    // 7. LOG AND RETURN
    const duration = track.end({
      userId: user.userId,
      categoryId: category._id.toString(),
    });

    logger.info("Category created successfully", {
      userId: user.userId,
      categoryId: category._id,
      name: category.name,
      type: category.type,
      duration,
    });

    return NextResponse.json(
      {
        message: "Category created successfully",
        category,
      },
      { status: 201 }
    );
  } catch (error: any) {
    track.end({ error: true });
    logger.error("Error creating category", error, {
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

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "A category with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: "Failed to create category",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
