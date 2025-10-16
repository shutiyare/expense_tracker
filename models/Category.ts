/**
 * ════════════════════════════════════════════════════════════════════════════
 * CATEGORY MODEL - OPTIMIZED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Optimizations:
 * ✅ Compound index on userId + type (most common query pattern)
 * ✅ Unique index on userId + name (prevent duplicate categories)
 * ✅ Optimized for caching (categories rarely change)
 * ✅ Automatic validation and sanitization
 */

import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true, // Single field index for user lookups
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },
    type: {
      type: String,
      enum: {
        values: ["expense", "income"],
        message: "{VALUE} is not a valid category type",
      },
      required: [true, "Category type is required"],
      index: true, // Index for filtering by type
    },
    color: {
      type: String,
      default: "#6366f1",
      validate: {
        validator: function (v: string) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: "Color must be a valid hex color code",
      },
    },
    icon: {
      type: String,
      default: "📁",
      maxlength: [10, "Icon cannot exceed 10 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ────────────────────────────────────────────────────────────────────────────
// INDEXES
// ────────────────────────────────────────────────────────────────────────────

// Compound index for most common query: get user categories by type
// This single index covers: { userId }, { userId, type }
CategorySchema.index({ userId: 1, type: 1 }, { background: true });

// Unique index to prevent duplicate category names per user
CategorySchema.index(
  { userId: 1, name: 1 },
  { unique: true, background: true }
);

// ────────────────────────────────────────────────────────────────────────────
// STATIC METHODS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get user categories with caching support
 */
CategorySchema.statics.getUserCategories = async function (
  userId: string,
  type?: "expense" | "income"
) {
  const filter: any = { userId };
  if (type) filter.type = type;

  return this.find(filter)
    .select("name type color icon") // Only fetch needed fields
    .sort({ name: 1 })
    .lean() // Return plain JS objects (faster)
    .exec();
};

// ────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ────────────────────────────────────────────────────────────────────────────

export default mongoose.models.Category ||
  mongoose.model("Category", CategorySchema);
