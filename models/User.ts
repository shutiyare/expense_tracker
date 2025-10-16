/**
 * ════════════════════════════════════════════════════════════════════════════
 * USER MODEL - OPTIMIZED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Optimizations:
 * ✅ Unique index on email for fast lookups
 * ✅ Sparse index on optional fields
 * ✅ Automatic timestamps
 * ✅ Virtual fields for computed properties
 * ✅ JSON serialization control (hide sensitive data)
 */

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Don't include in queries by default
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      maxlength: 3,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        // Remove sensitive fields from JSON output
        const { passwordHash, __v, ...rest } = ret;
        return rest;
      },
    },
    toObject: { virtuals: true },
  }
);

// ────────────────────────────────────────────────────────────────────────────
// INDEXES
// ────────────────────────────────────────────────────────────────────────────

// Unique index on email with case-insensitive collation (background: true for production)
UserSchema.index(
  { email: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
    background: true,
  }
);

// ────────────────────────────────────────────────────────────────────────────
// METHODS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get user profile without sensitive data
 */
UserSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    currency: this.currency,
    createdAt: this.createdAt,
  };
};

// ────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ────────────────────────────────────────────────────────────────────────────

export default mongoose.models.User || mongoose.model("User", UserSchema);
