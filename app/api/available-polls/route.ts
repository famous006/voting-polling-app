import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import { verifyToken, verifyActiveUser } from "@/lib/auth";

import Poll from "@/models/Polls";

export async function GET() {
    try {
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

        // Check account status for ordinary users
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

        await connectDB();

        const polls = await Poll.find()
            .select("title question status startDate endDate election")
            .sort({ createdAt: -1 })
            .populate("election", "title category state");

        return NextResponse.json({
            success: true,
            polls,
        });

    } catch (error) {
        console.error("Available polls error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to fetch polls." },
            { status: 500 }
        );
    }
}