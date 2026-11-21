import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { verifyActiveUser } from "@/lib/auth";

import Poll from "@/models/Polls";
import Vote from "@/models/Vote";

interface PollCandidate {
    _id: mongoose.Types.ObjectId;
    name: string;
    party: string;
    partyLogo?: string;
    profileImage?: string;
}

interface CandidateResult {
    candidateId: mongoose.Types.ObjectId;
    name: string;
    party: string;
    partyLogo?: string;
    profileImage?: string;
    votes: number;
    percentage: number;
}

// GET poll results
export async function GET(request: NextRequest) {
    // Prevent prerendering before accessing request-specific data
    await connection();

    try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please log in to view poll results.",
                },
                { status: 401 }
            );
        }

        // Verify authentication and current account status
        const payload = await verifyActiveUser(token);

        if (!payload) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Your account is invalid, suspended or inactive. Please log in again.",
                },
                { status: 401 }
            );
        }

        // Only users, admins and superadmins can access results
        if (
            payload.role !== "user" &&
            payload.role !== "admin" &&
            payload.role !== "superadmin"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized access.",
                },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const pollId = searchParams.get("pollId");

        if (!pollId || !mongoose.Types.ObjectId.isValid(pollId)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "A valid poll ID is required.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        // Find the requested poll
        const poll = await Poll.findById(pollId)
            .populate("election", "title category state")
            .populate(
                "candidates",
                "name party partyLogo profileImage"
            );

        if (!poll) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Poll not found.",
                },
                { status: 404 }
            );
        }

        // Count votes for each candidate
        const voteCounts = await Vote.aggregate([
            {
                $match: {
                    poll: new mongoose.Types.ObjectId(pollId),
                },
            },
            {
                $group: {
                    _id: "$candidate",
                    totalVotes: { $sum: 1 },
                },
            },
        ]);

        // Convert vote counts into a lookup map
        const voteMap = new Map(
            voteCounts.map((item) => [
                item._id.toString(),
                item.totalVotes,
            ])
        );

        const totalVotes = voteCounts.reduce(
            (total, item) => total + item.totalVotes,
            0
        );

        // Calculate candidate results
        const candidates = poll.candidates as unknown as PollCandidate[];

        const results: CandidateResult[] = candidates.map((candidate) => {
            const votes = voteMap.get(candidate._id.toString()) || 0;

            const percentage =
                totalVotes > 0
                    ? Number(((votes / totalVotes) * 100).toFixed(2))
                    : 0;

            return {
                candidateId: candidate._id,
                name: candidate.name,
                party: candidate.party,
                partyLogo: candidate.partyLogo,
                profileImage: candidate.profileImage,
                votes,
                percentage,
            };
        });

        // Sort candidates by highest votes
        results.sort(
            (a: CandidateResult, b: CandidateResult) =>
                b.votes - a.votes
        );

        return NextResponse.json({
            success: true,
            poll: {
                _id: poll._id,
                title: poll.title,
                question: poll.question,
                status: poll.status,
                election: poll.election,
            },
            totalVotes,
            results,
        });
    } catch (error) {
        console.error("Fetch results error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to fetch poll results.",
            },
            { status: 500 }
        );
    }
}