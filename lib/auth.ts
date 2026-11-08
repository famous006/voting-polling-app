import { jwtVerify, JWTPayload } from "jose";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from environment variables");
}

const secret = new TextEncoder().encode(JWT_SECRET);

// Check whether a role has administrative privileges
export function isAdminRole(role: unknown): boolean {
    return role === "admin" || role === "superadmin";
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret, {
            algorithms: ["HS256"],
        });

        return payload;
    } catch (error) {
        console.error("JWT verification failed:", error);
        return null;
    }
}

// Verify that a user is authenticated and their account is active
export async function verifyActiveUser(
    token: string
): Promise<JWTPayload | null> {
    const payload = await verifyToken(token);

    if (!payload || typeof payload.userId !== "string") {
        return null;
    }

    const allowedRoles = ["user", "admin", "superadmin"];

    if (
        typeof payload.role !== "string" ||
        !allowedRoles.includes(payload.role)
    ) {
        return null;
    }

    await connectDB();

    const user = await User.findById(payload.userId).select(
        "accountStatus role"
    );

    if (
        !user ||
        user.accountStatus === "suspended" ||
        user.role !== payload.role
    ) {
        return null;
    }

    return payload;
}