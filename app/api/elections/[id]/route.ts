import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";

import Election from "@/models/Election";
import Candidate from "@/models/Candidate";
import Poll from "@/models/Polls";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid election ID." },
                { status: 400 }
            );
        }

        await connectDB();

        const election = await Election.findById(id).lean();

        if (!election) {
            return NextResponse.json(
                { success: false, message: "Election not found." },
                { status: 404 }
            );
        }

        const candidates = await Candidate.find({
            election: id,
        }).lean();

        const polls = await Poll.find({
            election: id,
        })
            .populate("candidates", "name party partyLogo profileImage")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            election,
            candidates,
            polls,
        });

    } catch (error) {
        console.error("Election details error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to retrieve election details.",
            },
            { status: 500 }
        );
    }
}