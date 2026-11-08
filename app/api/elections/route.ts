import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Election from "@/models/Election";

export async function GET() {
    try {
        await connectDB();

        const elections = await Election.find()
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            elections,
        });

    } catch (error) {
        console.error("Public elections fetch error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to fetch elections.",
            },
            { status: 500 }
        );
    }
}