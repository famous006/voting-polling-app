import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { SignJWT } from "jose";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required" },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        }).select("+password");

        if (!user) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Check whether the account is suspended
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

        // Check whether the user has a password
        // Google-only accounts do not have passwords.
        if (!user.password) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This account uses Google Sign-In. Please continue with Google.",
                },
                { status: 401 }
            );
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Check JWT secret
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET is not configured");
        }

        // Generate authentication token
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
            message: "Login successful",
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

        // Store authentication token in cookie
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;

    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json(
            { message: "Something went wrong during login" },
            { status: 500 }
        );
    }
}