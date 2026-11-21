import { NextResponse } from "next/server";
import { connection } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";
import ActivityLog from "@/models/ActivityLog";

// GET: Fetch admin activity logs
export async function GET() {
    // Prevent prerendering before accessing request-specific data
    await connection();

    try {
        // Access cookies at request time
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized.",
                },
                { status: 401 }
            );
        }

        // Verify logged-in user
        const payload = await verifyActiveUser(token);

        const isAdmin =
            payload?.role === "admin" ||
            payload?.role === "superadmin";

        if (!isAdmin) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Admin access required.",
                },
                { status: 403 }
            );
        }

        // Connect to MongoDB
        await connectDB();

        // Fetch the latest 100 activity logs
        const logs = await ActivityLog.find()
            .populate("admin", "name email")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        return NextResponse.json({
            success: true,
            totalLogs: logs.length,
            logs,
        });
    } catch (error) {
        console.error("Fetch activity logs error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to fetch activity logs.",
            },
            { status: 500 }
        );
    }
}