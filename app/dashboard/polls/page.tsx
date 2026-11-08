"use client";

import { useEffect, useState } from "react";

interface Candidate {
    _id: string;
    name: string;
    party: string;
    partyLogo?: string;
    profileImage?: string;
}

interface Election {
    _id: string;
    title: string;
    category: string;
    state: string;
}

interface Poll {
    _id: string;
    title: string;
    question: string;
    election: Election | null;
    candidates: Candidate[];
    startDate: string;
    endDate: string;
    status: string;
    hasVoted: boolean;
}

export default function OpinionPollsPage() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [selectedCandidates, setSelectedCandidates] = useState<
        Record<string, string>
    >({});

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch available polls
    const fetchPolls = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/votes", {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to fetch polls.");
            }

            setPolls(data.polls || []);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolls();
    }, []);

    // Select a candidate
    const handleCandidateSelect = (
        pollId: string,
        candidateId: string
    ) => {
        setSelectedCandidates((previous) => ({
            ...previous,
            [pollId]: candidateId,
        }));

        setError("");
        setSuccess("");
    };

    // Submit vote
    const handleVote = async (pollId: string) => {
        const candidateId = selectedCandidates[pollId];

        if (!candidateId) {
            setError("Please select a candidate before submitting your vote.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to submit your vote? You cannot vote again in this poll."
        );

        if (!confirmed) return;

        try {
            setSubmitting(pollId);
            setError("");
            setSuccess("");

            const response = await fetch("/api/votes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pollId,
                    candidateId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to submit your vote.");
            }

            setSuccess(data.message);

            // Mark this poll as already voted
            setPolls((previous) =>
                previous.map((poll) =>
                    poll._id === pollId
                        ? { ...poll, hasVoted: true }
                        : poll
                )
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-5 text-black md:p-8">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Opinion Polls
                        </h1>

                        <p className="mt-2 text-sm text-slate-600">
                            Participate in ongoing opinion polls and make your voice heard.
                        </p>
                    </div>

                    <button
                        onClick={fetchPolls}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Refresh Polls
                    </button>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                        {success}
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                        <p className="text-slate-600">
                            Loading available polls...
                        </p>
                    </div>
                ) : polls.length === 0 ? (
                    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                        <h2 className="text-xl font-semibold">
                            No Active Polls
                        </h2>

                        <p className="mt-2 text-sm text-slate-600">
                            There are currently no opinion polls accepting votes.
                            Please check again later.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">

                        {polls.map((poll) => (
                            <div
                                key={poll._id}
                                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                            >
                                {/* Poll Header */}
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                        {poll.election?.category || "Opinion Poll"}
                                    </span>

                                    {poll.hasVoted ? (
                                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                            Voted
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                                            Open
                                        </span>
                                    )}
                                </div>

                                {/* Poll Information */}
                                <h2 className="text-xl font-bold">
                                    {poll.title}
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {poll.question}
                                </p>

                                {poll.election && (
                                    <div className="mt-3 text-xs text-slate-500">
                                        {poll.election.title} · {poll.election.state}
                                    </div>
                                )}

                                <div className="my-5 border-t border-slate-100" />

                                {/* Candidates */}
                                <h3 className="mb-3 font-semibold">
                                    Select your preferred candidate
                                </h3>

                                <div className="space-y-3">
                                    {poll.candidates.map((candidate) => (
                                        <label
                                            key={candidate._id}
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${selectedCandidates[poll._id] === candidate._id
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-slate-200 hover:border-blue-300"
                                                } ${poll.hasVoted
                                                    ? "cursor-not-allowed opacity-70"
                                                    : ""
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`poll-${poll._id}`}
                                                value={candidate._id}
                                                checked={
                                                    selectedCandidates[poll._id] === candidate._id
                                                }
                                                onChange={() =>
                                                    handleCandidateSelect(
                                                        poll._id,
                                                        candidate._id
                                                    )
                                                }
                                                disabled={poll.hasVoted}
                                                className="h-4 w-4 accent-blue-600"
                                            />

                                            {candidate.profileImage ? (
                                                <img
                                                    src={candidate.profileImage}
                                                    alt={candidate.name}
                                                    className="h-11 w-11 rounded-full border border-slate-200 object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                                                    {candidate.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold">
                                                    {candidate.name}
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    {candidate.party}
                                                </p>
                                            </div>

                                            {candidate.partyLogo && (
                                                <img
                                                    src={candidate.partyLogo}
                                                    alt={candidate.party}
                                                    className="h-8 w-8 object-contain"
                                                />
                                            )}
                                        </label>
                                    ))}
                                </div>

                                {/* Vote Button */}
                                <button
                                    onClick={() => handleVote(poll._id)}
                                    disabled={
                                        poll.hasVoted ||
                                        !selectedCandidates[poll._id] ||
                                        submitting === poll._id
                                    }
                                    className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {submitting === poll._id
                                        ? "Submitting Vote..."
                                        : poll.hasVoted
                                            ? "You Have Already Voted"
                                            : "Submit My Vote"}
                                </button>

                                <p className="mt-3 text-center text-xs text-slate-500">
                                    Poll closes:{" "}
                                    {new Date(poll.endDate).toLocaleDateString()}
                                </p>
                            </div>
                        ))}

                    </div>
                )}

                {/* Disclaimer */}
                <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs leading-6 text-blue-800">
                        <strong>Important:</strong> VoteHub is an independent
                        opinion-polling platform. Participation does not constitute
                        an official election vote and is not connected to INEC.
                    </p>
                </div>

            </div>
        </div>
    );
}