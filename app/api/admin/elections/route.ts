import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";

import Election from "@/models/Election";
import { logActivity } from "@/lib/activityLog";

// Verify admin and superadmin access
async function verifyAdmin(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const payload = await verifyActiveUser(token);

    if (
        (payload?.role !== "admin" &&
            payload?.role !== "superadmin") ||
        typeof payload.userId !== "string"
    ) {
        return null;
    }

    return payload.userId;
}

// GET: Retrieve all elections
export async function GET() {
    try {
        const adminId = await verifyAdmin();

        if (!adminId) {
            return NextResponse.json(
                { success: false, message: "Admin access required" },
                { status: 403 }
            );
        }

        await connectDB();

        const elections = await Election.find().sort({
            createdAt: -1,
        });

        return NextResponse.json({
            success: true,
            elections,
        });

    } catch (error) {
        console.error("Fetch elections error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to fetch elections" },
            { status: 500 }
        );
    }
}

// POST: Create a new election
export async function POST(request: NextRequest) {
    try {
        const adminId = await verifyAdmin();

        if (!adminId) {
            return NextResponse.json(
                { success: false, message: "Admin access required" },
                { status: 403 }
            );
        }

        const body = await request.json();

        const {
            title,
            category,
            state,
            description,
            startDate,
            endDate,
            status,
        } = body;

        // Validate required fields
        if (!title || !category || !startDate || !endDate) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Title, category, start date and end date are required",
                },
                { status: 400 }
            );
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end <= start
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please provide valid dates. End date must be after start date.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        const election = await Election.create({
            title: title.trim(),
            category,
            state: state?.trim() || "National",
            description: description?.trim() || "",
            startDate: start,
            endDate: end,
            status: status || "Upcoming",
        });

        // Record election creation
        await logActivity({
            adminId,
            action: "ELECTION_CREATED",
            description: `Created a new election: ${election.title}.`,
            targetType: "Election",
            targetId: election._id.toString(),
        });

        return NextResponse.json(
            {
                success: true,
                message: "Election created successfully",
                election,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Create election error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to create election" },
            { status: 500 }
        );
    }
}