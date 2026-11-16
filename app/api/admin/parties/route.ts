import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";

import PoliticalParty from "@/models/PoliticalParty";
import Candidate from "@/models/Candidate";

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

// GET: Fetch all political parties
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

        const parties = await PoliticalParty.find()
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            parties,
        });

    } catch (error) {
        console.error("Fetch political parties error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to fetch political parties" },
            { status: 500 }
        );
    }
}

// POST: Create a political party
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
            abbreviation,
            logo,
            description,
            website,
            status,
        } = body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof abbreviation !== "string" ||
            !abbreviation.trim()
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Party name and abbreviation are required",
                },
                { status: 400 }
            );
        }

        await connectDB();

        const existingParty = await PoliticalParty.findOne({
            $or: [
                { name: name.trim() },
                { abbreviation: abbreviation.trim().toUpperCase() },
            ],
        });

        if (existingParty) {
            return NextResponse.json(
                {
                    success: false,
                    message: "A party with this name or abbreviation already exists",
                },
                { status: 409 }
            );
        }

        const party = await PoliticalParty.create({
            name: name.trim(),
            abbreviation: abbreviation.trim().toUpperCase(),
            logo: typeof logo === "string" ? logo.trim() : "",
            description: typeof description === "string" ? description.trim() : "",
            website: typeof website === "string" ? website.trim() : "",
            status: status === "inactive" ? "inactive" : "active",
        });

        return NextResponse.json(
            {
                success: true,
                message: "Political party created successfully",
                party,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Create political party error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to create political party" },
            { status: 500 }
        );
    }
}

// PUT: Update a political party
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
            abbreviation,
            logo,
            description,
            website,
            status,
        } = body;

        if (
            !_id ||
            !mongoose.isValidObjectId(_id) ||
            typeof name !== "string" ||
            !name.trim() ||
            typeof abbreviation !== "string" ||
            !abbreviation.trim()
        ) {
            return NextResponse.json(
                { success: false, message: "Valid party ID, name and abbreviation are required" },
                { status: 400 }
            );
        }

        if (status && !["active", "inactive"].includes(status)) {
            return NextResponse.json(
                { success: false, message: "Invalid party status" },
                { status: 400 }
            );
        }

        await connectDB();

        const duplicateParty = await PoliticalParty.findOne({
            _id: { $ne: _id },
            $or: [
                { name: name.trim() },
                { abbreviation: abbreviation.trim().toUpperCase() },
            ],
        });

        if (duplicateParty) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Another party already uses this name or abbreviation",
                },
                { status: 409 }
            );
        }

        const party = await PoliticalParty.findByIdAndUpdate(
            _id,
            {
                name: name.trim(),
                abbreviation: abbreviation.trim().toUpperCase(),
                logo: typeof logo === "string" ? logo.trim() : "",
                description: typeof description === "string" ? description.trim() : "",
                website: typeof website === "string" ? website.trim() : "",
                status: status === "inactive" ? "inactive" : "active",
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!party) {
            return NextResponse.json(
                { success: false, message: "Political party not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Political party updated successfully",
            party,
        });

    } catch (error) {
        console.error("Update political party error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to update political party" },
            { status: 500 }
        );
    }
}

// DELETE: Delete a political party
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

        if (!id || !mongoose.isValidObjectId(id)) {
            return NextResponse.json(
                { success: false, message: "A valid party ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const party = await PoliticalParty.findById(id);

        if (!party) {
            return NextResponse.json(
                { success: false, message: "Political party not found" },
                { status: 404 }
            );
        }

        // Prevent deleting a party that is assigned to existing candidates
        const existingCandidate = await Candidate.exists({
            party: {
                $in: [party.name, party.abbreviation],
            },
        });

        if (existingCandidate) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This party is assigned to candidates and cannot be deleted.",
                },
                { status: 400 }
            );
        }

        await PoliticalParty.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: "Political party deleted successfully",
        });

    } catch (error) {
        console.error("Delete political party error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to delete political party" },
            { status: 500 }
        );
    }
}