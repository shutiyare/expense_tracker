import { NextRequest, NextResponse } from "next/server";
import Category from "@/models/Category";
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
    const type = searchParams.get("type"); // 'expense' or 'income'

    const query: any = { userId: user.userId };
    if (type) {
      query.type = type;
    }

    const categories = await Category.find(query).sort({ name: 1 });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Failed to fetch categories", error: error.message },
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
    if (!data.name || !data.type) {
      return NextResponse.json(
        { message: "Name and type are required" },
        { status: 400 }
      );
    }

    if (!["expense", "income"].includes(data.type)) {
      return NextResponse.json(
        { message: "Type must be either 'expense' or 'income'" },
        { status: 400 }
      );
    }

    await connectDB();

    // Create category
    const category = await Category.create({
      ...data,
      userId: user.userId,
    });

    return NextResponse.json(
      { message: "Category created successfully", category },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { message: "Failed to create category", error: error.message },
      { status: 500 }
    );
  }
}
