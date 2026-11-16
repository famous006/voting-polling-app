import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return NextResponse.json(
                { message: "Invalid registration payload" },
                { status: 400 }
            );
        }

        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email =
            typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const state = typeof body.state === "string" ? body.state.trim() : "";
        const lga = typeof body.lga === "string" ? body.lga.trim() : "";

        if (!name || !email || !password || !state) {
            return NextResponse.json(
                { message: "Please fill all required fields" },
                { status: 400 }
            );
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return NextResponse.json(
                { message: "Please enter a valid email address" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { message: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        await connectDB();

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return NextResponse.json(
                { message: "Email already registered" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            state,
            lga,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
        });

        try {
            await sendWelcomeEmail({
                email: user.email,
                name: user.name,
            });
        } catch (emailError) {
            console.error("Welcome email could not be sent:", emailError);
        }

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

        const response = NextResponse.json(
            {
                success: true,
                message: "Registration successful! You can now log in.",
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;

    } catch (error) {
        console.error("Signup error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong during registration. Please try again.",
            },
            { status: 500 }
        );
    }
}