import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ["expense", "income"],
        message: "{VALUE} is not a valid category type",
      },
      required: [true, "Category type is required"],
    },
    color: {
      type: String,
      default: "#6366f1",
    },
    icon: {
      type: String,
      default: "📁",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
CategorySchema.index({ userId: 1, type: 1 });

export default mongoose.models.Category ||
  mongoose.model("Category", CategorySchema);
