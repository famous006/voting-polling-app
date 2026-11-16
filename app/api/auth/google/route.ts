import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { SignJWT } from "jose";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendWelcomeEmail } from "@/lib/email";

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

export async function POST(request: NextRequest) {
    try {
        const { credential } = await request.json();

        if (!credential) {
            return NextResponse.json(
                { success: false, message: "Google credential is required" },
                { status: 400 }
            );
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            throw new Error("GOOGLE_CLIENT_ID is not configured");
        }

        // Verify Google's identity token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (
            !payload ||
            !payload.sub ||
            !payload.email ||
            !payload.email_verified
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Google account verification failed",
                },
                { status: 401 }
            );
        }

        await connectDB();

        const email = payload.email.toLowerCase();
        const googleId = payload.sub;

        // Find an existing account
        let user = await User.findOne({ email });

        let isNewUser = false;

        if (user) {
            // Prevent linking a different Google account
            if (user.googleId && user.googleId !== googleId) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "This email is already connected to another Google account.",
                    },
                    { status: 409 }
                );
            }

            // Connect Google to an existing account
            if (!user.googleId) {
                user.googleId = googleId;
                user.isEmailVerified = true;
                user.emailVerifiedAt = new Date();

                await user.save();
            }
        } else {
            // Create a new VoteHub account
            user = await User.create({
                name: payload.name || email.split("@")[0],
                email,
                googleId,
                state: "",
                lga: "",
                role: "user",
                accountStatus: "active",
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
            });

            isNewUser = true;
        }

        // Check suspended accounts
        if (user.accountStatus === "suspended") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Your account has been suspended. Please contact the administrator.",
                },
                { status: 403 }
            );
        }

        // Send welcome email to new Google users
        if (isNewUser) {
            try {
                await sendWelcomeEmail({
                    email: user.email,
                    name: user.name,
                });
            } catch (emailError) {
                console.error(
                    "Google welcome email could not be sent:",
                    emailError
                );
            }
        }

        // Generate VoteHub JWT
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET is not configured");
        }

        const token = await new SignJWT({
            userId: user._id.toString(),
            role: user.role,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(new TextEncoder().encode(secret));

        const response = NextResponse.json({
            success: true,
            message: "Google sign-in successful",
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;

    } catch (error) {
        console.error("Google authentication error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Google sign-in failed. Please try again.",
            },
            { status: 500 }
        );
    }
}