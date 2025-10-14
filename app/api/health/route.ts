import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();

    // Print the db name on connect
    const dbName = mongoose.connection.name;
    console.log(`✅ Connected to MongoDB database: ${dbName}`);

    return NextResponse.json({
      status: "OK",
      message: `Server is running and database (${dbName}) is connected`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "ERROR",
        message: "Database connection failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
