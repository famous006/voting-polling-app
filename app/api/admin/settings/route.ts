import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";
import Settings from "@/models/Settings";

// Verify admin or superadmin access
async function verifyAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return false;

    const payload = await verifyActiveUser(token);

    return (
        payload?.role === "admin" ||
        payload?.role === "superadmin"
    );
}

// GET: Fetch general settings
export async function GET() {
    try {
        const isAdmin = await verifyAdmin();

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, message: "Admin access required." },
                { status: 403 }
            );
        }

        await connectDB();

        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({});
        }

        return NextResponse.json({
            success: true,
            settings,
        });
    } catch (error) {
        console.error("Fetch settings error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to fetch settings." },
            { status: 500 }
        );
    }
}

// PATCH: Update general settings
export async function PATCH(request: NextRequest) {
    try {
        const isAdmin = await verifyAdmin();

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, message: "Admin access required." },
                { status: 403 }
            );
        }

        const body = await request.json();

        const {
            platformName,
            description,
            contactEmail,
            contactPhone,
            logo,
        } = body;

        if (!platformName?.trim()) {
            return NextResponse.json(
                { success: false, message: "Platform name is required." },
                { status: 400 }
            );
        }

        await connectDB();

        const settings = await Settings.findOneAndUpdate(
            {},
            {
                platformName: platformName.trim(),
                description: description?.trim() || "",
                contactEmail: contactEmail?.trim() || "",
                contactPhone: contactPhone?.trim() || "",
                logo: logo?.trim() || "",
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return NextResponse.json({
            success: true,
            message: "General settings updated successfully.",
            settings,
        });
    } catch (error) {
        console.error("Update settings error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to update settings." },
            { status: 500 }
        );
    }
}