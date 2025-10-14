import { NextRequest, NextResponse } from "next/server";
import Expense from "@/models/Expense";
import { connectDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryId = searchParams.get("categoryId");

    // Build query
    const query: any = { userId: user.userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    // Fetch expenses
    const expenses = await Expense.find(query)
      .populate("categoryId", "name color icon")
      .sort({ date: -1 })
      .limit(100);

    return NextResponse.json({ expenses });
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { message: "Failed to fetch expenses", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const data = await req.json();

    // Validation
    if (!data.title || !data.amount) {
      return NextResponse.json(
        { message: "Title and amount are required" },
        { status: 400 }
      );
    }

    if (data.amount < 0) {
      return NextResponse.json(
        { message: "Amount must be positive" },
        { status: 400 }
      );
    }

    await connectDB();

    // Create expense
    const expense = await Expense.create({
      ...data,
      userId: user.userId,
      date: data.date || new Date(),
    });

    // Populate category if exists
    await expense.populate("categoryId", "name color icon");

    return NextResponse.json(
      { message: "Expense created successfully", expense },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { message: "Failed to create expense", error: error.message },
      { status: 500 }
    );
  }
}
