import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";

import Poll from "@/models/Polls";
import Candidate from "@/models/Candidate";
import Vote from "@/models/Vote";
import User from "@/models/User";

import { sendVoteConfirmationEmail } from "@/lib/email";

// Verify that the person is a logged-in user with an active account
async function verifyUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return null;
    }

    try {
        const payload = await verifyActiveUser(token);

        if (
            !payload ||
            payload.role !== "user" ||
            typeof payload.userId !== "string" ||
            !mongoose.Types.ObjectId.isValid(payload.userId)
        ) {
            return null;
        }

        return payload.userId;
    } catch {
        return null;
    }
}

// GET: Fetch active polls available to the logged-in user
export async function GET() {
    try {
        const userId = await verifyUser();

        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Your account is inactive or you are not logged in.",
                },
                { status: 401 }
            );
        }

        await connectDB();

        const now = new Date();

        const polls = await Poll.find({
            status: "Active",
            startDate: { $lte: now },
            endDate: { $gte: now },
        })
            .populate("election", "title category state")
            .populate("candidates", "name party partyLogo profileImage")
            .sort({ createdAt: -1 });

        // Find polls this user has already voted in
        const pollIds = polls.map((poll) => poll._id);

        const existingVotes = await Vote.find({
            user: userId,
            poll: { $in: pollIds },
        }).select("poll");

        const votedPollIds = new Set(
            existingVotes.map((vote) => vote.poll.toString())
        );

        const pollsWithVoteStatus = polls.map((poll) => ({
            ...poll.toObject(),
            hasVoted: votedPollIds.has(poll._id.toString()),
        }));

        return NextResponse.json({
            success: true,
            polls: pollsWithVoteStatus,
        });
    } catch (error) {
        console.error("Fetch polls error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to fetch available polls.",
            },
            { status: 500 }
        );
    }
}

// POST: Submit a vote
export async function POST(request: NextRequest) {
    try {
        const userId = await verifyUser();

        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Your account is inactive or you are not logged in.",
                },
                { status: 401 }
            );
        }

        const body = await request.json();

        const { pollId, candidateId } = body;

        if (
            !pollId ||
            !candidateId ||
            !mongoose.Types.ObjectId.isValid(pollId) ||
            !mongoose.Types.ObjectId.isValid(candidateId)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid poll or candidate ID.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        // Find the selected poll
        const poll = await Poll.findById(pollId);

        if (!poll) {
            return NextResponse.json(
                { success: false, message: "Poll not found." },
                { status: 404 }
            );
        }

        // Confirm that the poll is active and within its scheduled dates
        const now = new Date();

        if (
            poll.status !== "Active" ||
            now < new Date(poll.startDate) ||
            now > new Date(poll.endDate)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This poll is not currently accepting votes.",
                },
                { status: 400 }
            );
        }

        // Confirm that the selected candidate belongs to this poll
        const candidateBelongsToPoll = poll.candidates.some(
            (id: mongoose.Types.ObjectId) =>
                id.toString() === candidateId
        );

        if (!candidateBelongsToPoll) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This candidate does not belong to this poll.",
                },
                { status: 400 }
            );
        }

        // Confirm that the candidate exists
        const candidate = await Candidate.findOne({
            _id: candidateId,
            election: poll.election,
        }).select("name");

        if (!candidate) {
            return NextResponse.json(
                { success: false, message: "Candidate not found." },
                { status: 404 }
            );
        }

        // Ensure the database unique index is initialized
        await Vote.init();

        // Save the user's vote
        await Vote.create({
            user: userId,
            poll: pollId,
            candidate: candidateId,
        });

        // Send vote confirmation email after successful vote
        try {
            const user = await User.findById(userId).select("name email");

            await poll.populate("election", "title");

            const election = poll.election as unknown as {
                title?: string;
            } | null;

            if (user?.email) {
                await sendVoteConfirmationEmail({
                    email: user.email,
                    name: user.name,
                    pollTitle: poll.title,
                    candidateName: candidate.name,
                    electionTitle: election?.title,
                });
            }
        } catch (emailError) {
            console.error(
                "Vote confirmation email could not be sent:",
                emailError
            );
        }

        return NextResponse.json({
            success: true,
            message: "Your vote has been submitted successfully!",
        });

    } catch (error: unknown) {
        // MongoDB duplicate key error: user has already voted in this poll
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "You have already voted in this poll.",
                },
                { status: 409 }
            );
        }

        console.error("Submit vote error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong while submitting your vote.",
            },
            { status: 500 }
        );
    }
}