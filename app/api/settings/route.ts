import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";

// GET: Fetch public platform settings
export async function GET() {
    try {
        await connectDB();

        const settings = await Settings.findOne()
            .select("platformName description logo contactEmail contactPhone")
            .lean();

        return NextResponse.json({
            success: true,
            settings: settings || {
                platformName: "VoteHub",
                description: "Your trusted independent opinion polling platform.",
                logo: "",
                contactEmail: "",
                contactPhone: "",
            },
        });

    } catch (error) {
        console.error("Fetch public settings error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to fetch platform settings.",
            },
            { status: 500 }
        );
    }
}