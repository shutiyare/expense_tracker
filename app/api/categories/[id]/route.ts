import { NextRequest, NextResponse } from "next/server";
import Category from "@/models/Category";
import { connectDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const data = await req.json();

    await connectDB();

    const { id } = await params;
    const category = await Category.findOneAndUpdate(
      { _id: id, userId: user.userId },
      data,
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error: any) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { message: "Failed to update category", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const category = await Category.findOneAndDelete({
      _id: id,
      userId: user.userId,
    });

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { message: "Failed to delete category", error: error.message },
      { status: 500 }
    );
  }
}
