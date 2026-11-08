import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";

import Candidate from "@/models/Candidate";
import Election from "@/models/Election";
import Vote from "@/models/Vote";

// Verify admin and superadmin access
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

// GET: Fetch all candidates
export async function GET() {
    try {
        const isAdmin = await verifyAdmin();

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, message: "Admin access required" },
                { status: 403 }
            );
        }

        await connectDB();

        const candidates = await Candidate.find()
            .populate("election", "title category state")
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            candidates,
        });

    } catch (error) {
        console.error("Fetch candidates error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to fetch candidates" },
            { status: 500 }
        );
    }
}

// POST: Create a new candidate
export async function POST(request: NextRequest) {
    try {
        const isAdmin = await verifyAdmin();

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, message: "Admin access required" },
                { status: 403 }
            );
        }

        const body = await request.json();

        const {
            name,
            party,
            partyLogo,
            profileImage,
            state,
            election,
            biography,
        } = body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof party !== "string" ||
            !party.trim() ||
            !election
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Candidate name, party and election are required",
                },
                { status: 400 }
            );
        }

        await connectDB();

        const existingElection = await Election.findById(election);

        if (!existingElection) {
            return NextResponse.json(
                { success: false, message: "Selected election does not exist" },
                { status: 404 }
            );
        }

        const candidate = await Candidate.create({
            name: name.trim(),
            party: party.trim(),
            partyLogo: partyLogo?.trim() || "",
            profileImage: profileImage?.trim() || "",
            state: state?.trim() || existingElection.state,
            election,
            biography: biography?.trim() || "",
        });

        return NextResponse.json(
            {
                success: true,
                message: "Candidate created successfully",
                candidate,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Create candidate error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to create candidate" },
            { status: 500 }
        );
    }
}

// PUT: Update an existing candidate
export async function PUT(request: NextRequest) {
    try {
        const isAdmin = await verifyAdmin();

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, message: "Admin access required" },
                { status: 403 }
            );
        }

        const body = await request.json();

        const {
            _id,
            name,
            party,
            partyLogo,
            profileImage,
            state,
            election,
            biography,
        } = body;

        if (
            !_id ||
            typeof name !== "string" ||
            !name.trim() ||
            typeof party !== "string" ||
            !party.trim() ||
            !election
        ) {
            return NextResponse.json(
                { success: false, message: "Required fields are missing" },
                { status: 400 }
            );
        }

        await connectDB();

        const existingElection = await Election.findById(election);

        if (!existingElection) {
            return NextResponse.json(
                { success: false, message: "Selected election does not exist" },
                { status: 404 }
            );
        }

        const candidate = await Candidate.findByIdAndUpdate(
            _id,
            {
                name: name.trim(),
                party: party.trim(),
                partyLogo: partyLogo?.trim() || "",
                profileImage: profileImage?.trim() || "",
                state: state?.trim() || existingElection.state,
                election,
                biography: biography?.trim() || "",
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!candidate) {
            return NextResponse.json(
                { success: false, message: "Candidate not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Candidate updated successfully",
            candidate,
        });

    } catch (error) {
        console.error("Update candidate error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to update candidate" },
            { status: 500 }
        );
    }
}

// DELETE: Delete an existing candidate
export async function DELETE(request: NextRequest) {
    try {
        const isAdmin = await verifyAdmin();

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, message: "Admin access required" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Candidate ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const candidate = await Candidate.findById(id);

        if (!candidate) {
            return NextResponse.json(
                { success: false, message: "Candidate not found" },
                { status: 404 }
            );
        }

        // Check whether the candidate already has votes
        const existingVotes = await Vote.exists({
            candidate: candidate._id,
        });

        if (existingVotes) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This candidate has votes and cannot be deleted.",
                },
                { status: 400 }
            );
        }

        await Candidate.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: "Candidate deleted successfully",
        });

    } catch (error) {
        console.error("Delete candidate error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to delete candidate" },
            { status: 500 }
        );
    }
}