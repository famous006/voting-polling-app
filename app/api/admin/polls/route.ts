import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";

import Poll from "@/models/Polls";
import Election from "@/models/Election";
import Candidate from "@/models/Candidate";
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

// Validate candidates belong to the selected election
async function validateCandidates(
    candidates: string[],
    election: string
) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
        return false;
    }

    if (!candidates.every((id) => mongoose.isValidObjectId(id))) {
        return false;
    }

    const validCandidates = await Candidate.countDocuments({
        _id: { $in: candidates },
        election,
    });

    return validCandidates === new Set(candidates).size;
}

// GET: Fetch all polls with participant counts
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

        const polls = await Poll.find()
            .populate("election", "title category state")
            .populate("candidates", "name party partyLogo profileImage")
            .sort({ createdAt: -1 });

        const pollsWithParticipants = await Promise.all(
            polls.map(async (poll) => {
                const participantCount = await Vote.countDocuments({
                    poll: poll._id,
                });

                return {
                    ...poll.toObject(),
                    participantCount,
                };
            })
        );

        return NextResponse.json({
            success: true,
            polls: pollsWithParticipants,
        });

    } catch (error) {
        console.error("Fetch polls error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to fetch polls" },
            { status: 500 }
        );
    }
}

// POST: Create a new poll
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
            title,
            question,
            election,
            candidates,
            startDate,
            endDate,
            status,
        } = body;

        if (
            !title?.trim() ||
            !question?.trim() ||
            !election ||
            !startDate ||
            !endDate
        ) {
            return NextResponse.json(
                { success: false, message: "Please fill in all required fields" },
                { status: 400 }
            );
        }

        if (!mongoose.isValidObjectId(election)) {
            return NextResponse.json(
                { success: false, message: "Invalid election ID" },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end <= start
        ) {
            return NextResponse.json(
                { success: false, message: "Please provide valid poll dates" },
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

        const validCandidates = await validateCandidates(
            candidates,
            election
        );

        if (!validCandidates) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Select valid candidates belonging to this election",
                },
                { status: 400 }
            );
        }

        const poll = await Poll.create({
            title: title.trim(),
            question: question.trim(),
            election,
            candidates,
            startDate: start,
            endDate: end,
            status: status || "Upcoming",
        });

        return NextResponse.json(
            {
                success: true,
                message: "Opinion poll created successfully",
                poll,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Create poll error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to create poll" },
            { status: 500 }
        );
    }
}

// PUT: Update an existing poll
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
            title,
            question,
            election,
            candidates,
            startDate,
            endDate,
            status,
        } = body;

        if (
            !_id ||
            !mongoose.isValidObjectId(_id) ||
            !title?.trim() ||
            !question?.trim() ||
            !election ||
            !startDate ||
            !endDate
        ) {
            return NextResponse.json(
                { success: false, message: "Required fields are missing or invalid" },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end <= start
        ) {
            return NextResponse.json(
                { success: false, message: "Please provide valid poll dates" },
                { status: 400 }
            );
        }

        await connectDB();

        const existingPoll = await Poll.findById(_id);

        if (!existingPoll) {
            return NextResponse.json(
                { success: false, message: "Poll not found" },
                { status: 404 }
            );
        }

        if (!mongoose.isValidObjectId(election)) {
            return NextResponse.json(
                { success: false, message: "Invalid election ID" },
                { status: 400 }
            );
        }

        const existingElection = await Election.findById(election);

        if (!existingElection) {
            return NextResponse.json(
                { success: false, message: "Selected election does not exist" },
                { status: 404 }
            );
        }

        const validCandidates = await validateCandidates(
            candidates,
            election
        );

        if (!validCandidates) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Select valid candidates belonging to this election",
                },
                { status: 400 }
            );
        }

        const updatedPoll = await Poll.findByIdAndUpdate(
            _id,
            {
                title: title.trim(),
                question: question.trim(),
                election,
                candidates,
                startDate: start,
                endDate: end,
                status,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        return NextResponse.json({
            success: true,
            message: "Poll updated successfully",
            poll: updatedPoll,
        });

    } catch (error) {
        console.error("Update poll error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to update poll" },
            { status: 500 }
        );
    }
}

// DELETE: Delete a poll
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
                { success: false, message: "Valid poll ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const poll = await Poll.findById(id);

        if (!poll) {
            return NextResponse.json(
                { success: false, message: "Poll not found" },
                { status: 404 }
            );
        }

        // Protect existing voting records
        const existingVotes = await Vote.exists({ poll: id });

        if (existingVotes) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This poll has votes and cannot be deleted.",
                },
                { status: 400 }
            );
        }

        await Poll.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: "Poll deleted successfully",
        });

    } catch (error) {
        console.error("Delete poll error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to delete poll" },
            { status: 500 }
        );
    }
}