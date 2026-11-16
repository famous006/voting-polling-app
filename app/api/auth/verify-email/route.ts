import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
    try {
        // Get verification token from URL
        const token = request.nextUrl.searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Verification token is missing.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        // Hash the received token
        const tokenHash = createHash("sha256")
            .update(token)
            .digest("hex");

        // Find and verify the account
        const user = await User.findOneAndUpdate(
            {
                emailVerificationTokenHash: tokenHash,
                emailVerificationExpiresAt: {
                    $gt: new Date(),
                },
                isEmailVerified: false,
            },
            {
                $set: {
                    isEmailVerified: true,
                    emailVerifiedAt: new Date(),
                },
                $unset: {
                    emailVerificationTokenHash: 1,
                    emailVerificationExpiresAt: 1,
                },
            },
            {
                new: true,
            }
        );

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This verification link is invalid, expired, or has already been used.",
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message:
                    "Your email has been verified successfully! You can now log in to VoteHub.",
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Email verification error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to verify your email. Please try again.",
            },
            { status: 500 }
        );
    }
}