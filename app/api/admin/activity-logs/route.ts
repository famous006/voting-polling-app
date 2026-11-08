import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";
import ActivityLog from "@/models/ActivityLog";

// Verify admin or superadmin access
async function verifyAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return false;

    const payload = await verifyActiveUser(token);

    return (
        payload?.role === "admin" ||
        payload?.role === "superadmin"
    );
}

// GET: Fetch admin activity logs
export async function GET() {
    try {
        const isAdmin = await verifyAdmin();

        if (!isAdmin) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Admin access required.",
                },
                { status: 403 }
            );
        }

        await connectDB();

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