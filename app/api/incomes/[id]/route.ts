import { NextRequest, NextResponse } from "next/server";
import Income from "@/models/Income";
import Category from "@/models/Category"; // Import Category model for populate
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
    const income = await Income.findOne({
      _id: id,
      userId: user.userId,
    }).populate("categoryId", "name color icon");

    if (!income) {
      return NextResponse.json(
        { message: "Income not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ income });
  } catch (error: any) {
    console.error("Error fetching income:", error);
    return NextResponse.json(
      { message: "Failed to fetch income", error: error.message },
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

    if (data.amount !== undefined && data.amount < 0) {
      return NextResponse.json(
        { message: "Amount must be positive" },
        { status: 400 }
      );
    }

    await connectDB();

    const { id } = await params;
    const income = await Income.findOneAndUpdate(
      { _id: id, userId: user.userId },
      data,
      { new: true, runValidators: true }
    ).populate("categoryId", "name color icon");

    if (!income) {
      return NextResponse.json(
        { message: "Income not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Income updated successfully",
      income,
    });
  } catch (error: any) {
    console.error("Error updating income:", error);
    return NextResponse.json(
      { message: "Failed to update income", error: error.message },
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
    const income = await Income.findOneAndDelete({
      _id: id,
      userId: user.userId,
    });

    if (!income) {
      return NextResponse.json(
        { message: "Income not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Income deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting income:", error);
    return NextResponse.json(
      { message: "Failed to delete income", error: error.message },
      { status: 500 }
    );
  }
}
