import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function proxy(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;

    const isAdminDashboard = pathname.startsWith("/admin");
    const isClientDashboard = pathname.startsWith("/dashboard");

    const isAuthPage =
        pathname === "/login" || pathname === "/signup";

    const payload = token ? await verifyToken(token) : null;

    const isAdmin =
        payload?.role === "admin" ||
        payload?.role === "superadmin";

    // Protect dashboards from unauthenticated visitors
    if ((isAdminDashboard || isClientDashboard) && !payload) {
        const response = NextResponse.redirect(
            new URL("/login", request.url)
        );

        response.cookies.delete("token");
        return response;
    }

    // Verify account status and current role
    if (payload) {
        try {
            await connectDB();

            const user = await User.findById(
                String(payload.userId)
            ).select("accountStatus role");

            // Reject deleted, suspended or outdated accounts
            if (
                !user ||
                user.accountStatus === "suspended" ||
                user.role !== payload.role
            ) {
                const response = NextResponse.redirect(
                    new URL("/login", request.url)
                );

                response.cookies.delete("token");
                return response;
            }

        } catch (error) {
            console.error("Account verification error:", error);

            return NextResponse.json(
                {
                    success: false,
                    message: "Unable to verify your account. Please try again.",
                },
                { status: 503 }
            );
        }
    }

    // Only admins and superadmins can access admin pages
    if (isAdminDashboard && !isAdmin) {
        return NextResponse.redirect(
            new URL("/dashboard", request.url)
        );
    }

    // Admins and superadmins cannot access the ordinary user dashboard
    if (isClientDashboard && isAdmin) {
        return NextResponse.redirect(
            new URL("/admin/dashboard", request.url)
        );
    }

    // Redirect authenticated users away from login and signup
    if (isAuthPage && payload) {
        return NextResponse.redirect(
            new URL(
                isAdmin
                    ? "/admin/dashboard"
                    : "/dashboard",
                request.url
            )
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        "/login",
        "/signup",
    ],
};