import { NextResponse } from "next/server";
import { connection } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { verifyToken, verifyActiveUser } from "@/lib/auth";

import Poll from "@/models/Polls";
import Election from "@/models/Election";

export async function GET() {
    // Ensure this route executes at request time
    await connection();

    try {
        // Get the user's authentication token
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Please log in." },
                { status: 401 }
            );
        }

        // Verify the JWT
        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json(
                { success: false, message: "Invalid authentication." },
                { status: 401 }
            );
        }

        // Allow only users and administrators
        if (!["user", "admin"].includes(payload.role as string)) {
            return NextResponse.json(
                { success: false, message: "Unauthorized access." },
                { status: 403 }
            );
        }

        // Verify that ordinary users are still active
        if (payload.role === "user") {
            const activeUser = await verifyActiveUser(token);

            if (!activeUser) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Your account has been suspended or is inactive.",
                    },
                    { status: 403 }
                );
            }
        }

        // Connect to MongoDB
        await connectDB();

        // Fetch polls and populate their associated elections
        const polls = await Poll.find()
            .select("title question status startDate endDate election")
            .sort({ createdAt: -1 })
            .populate({
                path: "election",
                model: Election,
                select: "title category state",
            })
            .lean();

        return NextResponse.json({
            success: true,
            polls,
        });

    } catch (error) {
        console.error("Available polls error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to fetch available polls.",
            },
            { status: 500 }
        );
    }
}