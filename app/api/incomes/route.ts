import { NextRequest, NextResponse } from "next/server";
import Income from "@/models/Income";
import { connectDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryId = searchParams.get("categoryId");

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

    const incomes = await Income.find(query)
      .populate("categoryId", "name color icon")
      .sort({ date: -1 })
      .limit(100);

    return NextResponse.json({ incomes });
  } catch (error: any) {
    console.error("Error fetching incomes:", error);
    return NextResponse.json(
      { message: "Failed to fetch incomes", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const income = await Income.create({
      ...data,
      userId: user.userId,
      date: data.date || new Date(),
    });

    await income.populate("categoryId", "name color icon");

    return NextResponse.json(
      { message: "Income created successfully", income },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating income:", error);
    return NextResponse.json(
      { message: "Failed to create income", error: error.message },
      { status: 500 }
    );
  }
}
