import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import Category from "@/models/Category";
import { connectDB } from "@/lib/db";
import {
  defaultExpenseCategories,
  defaultIncomeCategories,
} from "@/lib/default-categories";

export async function POST(req: Request) {
  try {
    const { name, email, password, currency } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      currency: currency || "USD",
    });

    // Create default categories for the new user
    const expenseCategories = defaultExpenseCategories.map((cat) => ({
      ...cat,
      userId: newUser._id,
    }));

    const incomeCategories = defaultIncomeCategories.map((cat) => ({
      ...cat,
      userId: newUser._id,
    }));

    await Category.insertMany([...expenseCategories, ...incomeCategories]);

    // Return success response (without sensitive data)
    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          currency: newUser.currency,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Registration failed", error: error.message },
      { status: 500 }
    );
  }
}
