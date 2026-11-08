import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { verifyActiveUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Not authenticated." },
                { status: 401 }
            );
        }

        const payload = await verifyActiveUser(token);

        if (!payload) {
            return NextResponse.json(
                { success: false, message: "Invalid or inactive account." },
                { status: 401 }
            );
        }

        await connectDB();

        const user = await User.findById(payload.userId).select(
            "name email state lga role accountStatus createdAt"
        );

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User account not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            role: user.role,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                state: user.state,
                lga: user.lga,
                role: user.role,
                accountStatus: user.accountStatus,
                createdAt: user.createdAt,
            },
        });

    } catch (error) {
        console.error("Account information error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to retrieve account information.",
            },
            { status: 500 }
        );
    }
}