import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";
import User from "@/models/User";
import { logActivity } from "@/lib/activityLog";

// Verify Super Admin access
async function verifySuperAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const payload = await verifyActiveUser(token);

    if (payload?.role !== "superadmin") {
        return null;
    }

    return payload;
}

// GET: Fetch all administrators
export async function GET() {
    try {
        const payload = await verifySuperAdmin();

        if (!payload) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Super Admin access required.",
                },
                { status: 403 }
            );
        }

        await connectDB();

        const admins = await User.find({
            role: { $in: ["admin", "superadmin"] },
        })
            .select("name email state lga role accountStatus createdAt")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            totalAdmins: admins.length,
            admins,
        });

    } catch (error) {
        console.error("Fetch administrators error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to fetch administrators.",
            },
            { status: 500 }
        );
    }
}

// PATCH: Promote or demote administrators
export async function PATCH(request: NextRequest) {
    try {
        const payload = await verifySuperAdmin();

        if (!payload) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Super Admin access required.",
                },
                { status: 403 }
            );
        }

        const { userId, action } = await request.json();

        if (
            !userId ||
            !mongoose.Types.ObjectId.isValid(userId)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "A valid user ID is required.",
                },
                { status: 400 }
            );
        }

        if (!["promote", "demote"].includes(action)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid administrator action.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        // Find the account to manage
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User account not found.",
                },
                { status: 404 }
            );
        }

        // Promote an ordinary user to Admin
        if (action === "promote") {
            if (user.role !== "user") {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Only ordinary users can be promoted.",
                    },
                    { status: 400 }
                );
            }

            if (user.accountStatus === "suspended") {
                return NextResponse.json(
                    {
                        success: false,
                        message: "A suspended account cannot be promoted.",
                    },
                    { status: 400 }
                );
            }

            user.role = "admin";
            await user.save();

            await logActivity({
                adminId: String(payload.userId),
                action: "ADMIN_PROMOTED",
                description: `${user.name} was promoted to Admin.`,
                targetType: "User",
                targetId: user._id.toString(),
            });

            return NextResponse.json({
                success: true,
                message: `${user.name} has been promoted to Admin.`,
            });
        }

        // Demote an Admin back to ordinary User
        if (action === "demote") {
            if (user.role !== "admin") {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Only ordinary Admins can be demoted.",
                    },
                    { status: 400 }
                );
            }

            user.role = "user";
            await user.save();

            await logActivity({
                adminId: String(payload.userId),
                action: "ADMIN_DEMOTED",
                description: `${user.name} was demoted from Admin to User.`,
                targetType: "User",
                targetId: user._id.toString(),
            });

            return NextResponse.json({
                success: true,
                message: `${user.name} has been demoted to User.`,
            });
        }

    } catch (error) {
        console.error("Manage administrators error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to manage administrators.",
            },
            { status: 500 }
        );
    }
}   