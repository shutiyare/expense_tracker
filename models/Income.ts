import mongoose from "mongoose";

const IncomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    title: {
      type: String,
      required: [true, "Income title is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    source: {
      type: String,
      enum: {
        values: ["salary", "freelance", "investment", "gift", "other"],
        message: "{VALUE} is not a valid income source",
      },
      default: "other",
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
IncomeSchema.index({ userId: 1, date: -1 });

export default mongoose.models.Income || mongoose.model("Income", IncomeSchema);
