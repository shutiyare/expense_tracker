import { NextRequest, NextResponse } from "next/server";
import Expense from "@/models/Expense";
import { connectDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
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
    const expense = await Expense.findOne({
      _id: id,
      userId: user.userId,
    }).populate("categoryId", "name color icon");

    if (!expense) {
      return NextResponse.json(
        { message: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ expense });
  } catch (error: any) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { message: "Failed to fetch expense", error: error.message },
      { status: 500 }
    );
  }
}

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

    // Validation
    if (data.amount !== undefined && data.amount < 0) {
      return NextResponse.json(
        { message: "Amount must be positive" },
        { status: 400 }
      );
    }

    await connectDB();

    const { id } = await params;
    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: user.userId },
      data,
      { new: true, runValidators: true }
    ).populate("categoryId", "name color icon");

    if (!expense) {
      return NextResponse.json(
        { message: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (error: any) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { message: "Failed to update expense", error: error.message },
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
    const expense = await Expense.findOneAndDelete({
      _id: id,
      userId: user.userId,
    });

    if (!expense) {
      return NextResponse.json(
        { message: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Expense deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { message: "Failed to delete expense", error: error.message },
      { status: 500 }
    );
  }
}
