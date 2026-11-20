import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";

import User from "@/models/User";
import Election from "@/models/Election";
import Poll from "@/models/Polls";
import Vote from "@/models/Vote";

export async function GET(request: NextRequest) {
    // Wait for an actual request before accessing request data
    await connection();

    try {
        // 1. Get authentication token from request cookies
        const token = request.cookies.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Verify active admin or superadmin
        const payload = await verifyActiveUser(token);

        if (
            payload?.role !== "admin" &&
            payload?.role !== "superadmin"
        ) {
            return NextResponse.json(
                { success: false, message: "Admin access required" },
                { status: 403 }
            );
        }

        // 3. Connect to MongoDB
        await connectDB();

        // 4. Retrieve dashboard statistics
        const [
            totalElections,
            totalParticipants,
            activeOpinionPolls,
            registeredUsers,
        ] = await Promise.all([
            Election.countDocuments(),
            Vote.countDocuments(),
            Poll.countDocuments({ status: "Active" }),
            User.countDocuments({ role: "user" }),
        ]);

        // 5. Return statistics
        return NextResponse.json({
            success: true,
            stats: {
                totalElections,
                totalParticipants,
                activeOpinionPolls,
                registeredUsers,
            },
        });

    } catch (error) {
        console.error("Admin statistics error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to retrieve dashboard statistics",
            },
            { status: 500 }
        );
    }
}