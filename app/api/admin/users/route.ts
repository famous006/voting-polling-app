import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";

import User from "@/models/User";
import { logActivity } from "@/lib/activityLog";

// Verify admin and superadmin access
async function verifyAdmin(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const payload = await verifyActiveUser(token);

    if (
        (payload?.role !== "admin" &&
            payload?.role !== "superadmin") ||
        typeof payload.userId !== "string"
    ) {
        return null;
    }

    return payload.userId;
}

// GET: Fetch all registered users
export async function GET(request: NextRequest) {
    try {
        const adminId = await verifyAdmin();

        if (!adminId) {
            return NextResponse.json(
                { success: false, message: "Admin access required." },
                { status: 403 }
            );
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";

        const users = await User.find({
            role: "user",
            ...(search
                ? {
                    $or: [
                        { name: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } },
                    ],
                }
                : {}),
        })
            .select("-password")
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            totalUsers: users.length,
            users,
        });

    } catch (error) {
        console.error("Fetch users error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to fetch users." },
            { status: 500 }
        );
    }
}

// PATCH: Suspend or reactivate an ordinary user
export async function PATCH(request: NextRequest) {
    try {
        const adminId = await verifyAdmin();

        if (!adminId) {
            return NextResponse.json(
                { success: false, message: "Admin access required." },
                { status: 403 }
            );
        }

        const { userId, accountStatus } = await request.json();

        if (
            !userId ||
            !["active", "suspended"].includes(accountStatus)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid user ID or account status.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        // Only ordinary users can be suspended through this endpoint
        const user = await User.findOneAndUpdate(
            {
                _id: userId,
                role: "user",
            },
            {
                accountStatus,
            },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User not found or account cannot be modified here.",
                },
                { status: 404 }
            );
        }

        // Record the admin activity
        await logActivity({
            adminId,
            action:
                accountStatus === "suspended"
                    ? "USER_SUSPENDED"
                    : "USER_REACTIVATED",
            description:
                accountStatus === "suspended"
                    ? `Suspended the account of ${user.name} (${user.email}).`
                    : `Reactivated the account of ${user.name} (${user.email}).`,
            targetType: "User",
            targetId: user._id.toString(),
        });

        return NextResponse.json({
            success: true,
            message:
                accountStatus === "suspended"
                    ? "User account suspended successfully."
                    : "User account reactivated successfully.",
            user,
        });

    } catch (error) {
        console.error("Update user status error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to update user account.",
            },
            { status: 500 }
        );
    }
}