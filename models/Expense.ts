import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
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
      required: [true, "Expense title is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["cash", "card", "mobile_money", "bank_transfer", "other"],
        message: "{VALUE} is not a valid payment method",
      },
      default: "cash",
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
ExpenseSchema.index({ userId: 1, date: -1 });

export default mongoose.models.Expense ||
  mongoose.model("Expense", ExpenseSchema);
