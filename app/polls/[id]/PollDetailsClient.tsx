"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
    id: string;
}

interface Candidate {
    _id: string;
    name: string;
    party: string;
    partyLogo?: string;
    profileImage?: string;
    biography?: string;
}

interface Election {
    title: string;
    category: string;
    state?: string;
}

interface Poll {
    _id: string;
    title: string;
    question: string;
    status: string;
    startDate: string;
    endDate: string;
    candidates: Candidate[];
    hasVoted: boolean;
    election?: Election;
}

export default function PollDetailsClient({ id }: Props) {
    const [poll, setPoll] = useState<Poll | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Fetch poll details
    useEffect(() => {
        const fetchPoll = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch("/api/votes", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Unable to load opinion polls."
                    );
                }

                const foundPoll = data.polls?.find(
                    (item: Poll) => item._id === id
                );

                if (!foundPoll) {
                    setError(
                        "This poll is unavailable. It may be closed or not currently active."
                    );
                    return;
                }

                setPoll(foundPoll);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load this poll."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPoll();
    }, [id]);

    // Submit vote
    const handleVote = async () => {
        if (!selectedCandidate) {
            setError("Please select a candidate first.");
            return;
        }

        if (!poll) return;

        try {
            setSubmitting(true);
            setError("");
            setMessage("");

            const response = await fetch("/api/votes", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pollId: id,
                    candidateId: selectedCandidate,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to submit your vote."
                );
            }

            setPoll({
                ...poll,
                hasVoted: true,
            });

            setMessage("Your vote has been submitted successfully!");
            setSelectedCandidate("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <p className="font-semibold text-gray-700">
                    Loading opinion poll...
                </p>
            </div>
        );
    }

    if (error && !poll) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 px-5">
                <div className="w-full max-w-lg rounded-xl bg-white p-8 text-center shadow">
                    <h1 className="mb-4 text-2xl font-bold text-gray-900">
                        Poll Unavailable
                    </h1>

                    <p className="mb-6 text-gray-600">{error}</p>

                    <Link
                        href="/dashboard"
                        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (!poll) return null;

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Navigation */}
            <nav className="border-b bg-white shadow-sm">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">

                    <Link
                        href="/dashboard"
                        className="text-2xl font-bold text-blue-700"
                    >
                        VoteHub
                    </Link>

                    <div className="flex gap-5 text-sm font-medium text-gray-700">
                        <Link href="/dashboard">Dashboard</Link>
                        <Link href="/results">Results</Link>
                        <Link href="/profile">Profile</Link>
                    </div>

                </div>
            </nav>

            <main className="mx-auto max-w-5xl px-5 py-10">

                <Link
                    href="/dashboard"
                    className="mb-6 inline-block font-medium text-blue-600 hover:underline"
                >
                    ← Back to Dashboard
                </Link>

                {/* Poll Information */}
                <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">

                    <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                        {poll.status}
                    </span>

                    <h1 className="mb-4 mt-5 text-3xl font-bold text-gray-900">
                        {poll.title}
                    </h1>

                    <p className="mb-6 text-lg text-gray-700">
                        {poll.question}
                    </p>

                    {poll.election && (
                        <div className="mb-5 rounded-lg bg-blue-50 p-4">
                            <p className="text-sm text-gray-500">
                                Related Election
                            </p>

                            <h2 className="font-semibold text-gray-900">
                                {poll.election.title}
                            </h2>

                            <p className="text-sm text-gray-600">
                                {poll.election.category}
                                {poll.election.state
                                    ? ` • ${poll.election.state}`
                                    : ""}
                            </p>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">

                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-sm text-gray-500">
                                Poll Starts
                            </p>

                            <p className="font-semibold text-gray-900">
                                {new Date(
                                    poll.startDate
                                ).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-sm text-gray-500">
                                Poll Ends
                            </p>

                            <p className="font-semibold text-gray-900">
                                {new Date(
                                    poll.endDate
                                ).toLocaleDateString()}
                            </p>
                        </div>

                    </div>
                </section>

                {/* Voting Section */}
                <section className="rounded-xl bg-white p-6 shadow-sm">

                    <h2 className="mb-2 text-2xl font-bold text-gray-900">
                        Choose Your Candidate
                    </h2>

                    <p className="mb-6 text-gray-600">
                        Select one candidate to participate in this opinion poll.
                    </p>

                    {message && (
                        <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
                            {error}
                        </div>
                    )}

                    {poll.hasVoted ? (

                        <div className="rounded-lg bg-green-50 p-6 text-center">

                            <h3 className="mb-2 text-xl font-bold text-green-800">
                                You Have Already Voted
                            </h3>

                            <p className="text-green-700">
                                Your vote has been recorded. You cannot vote
                                again in this poll.
                            </p>

                            <Link
                                href="/results"
                                className="mt-5 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white"
                            >
                                View Results
                            </Link>

                        </div>

                    ) : (

                        <>
                            <div className="grid gap-5 md:grid-cols-2">

                                {poll.candidates?.map((candidate) => (

                                    <label
                                        key={candidate._id}
                                        className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-5 ${
                                            selectedCandidate === candidate._id
                                                ? "border-blue-600 bg-blue-50"
                                                : "border-gray-200 hover:border-blue-300"
                                        }`}
                                    >

                                        <input
                                            type="radio"
                                            name="candidate"
                                            checked={
                                                selectedCandidate === candidate._id
                                            }
                                            onChange={() =>
                                                setSelectedCandidate(candidate._id)
                                            }
                                            className="h-5 w-5 accent-blue-600"
                                        />

                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">

                                            {candidate.profileImage ? (
                                                <img
                                                    src={candidate.profileImage}
                                                    alt={candidate.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : candidate.partyLogo ? (
                                                <img
                                                    src={candidate.partyLogo}
                                                    alt={candidate.party}
                                                    className="h-full w-full object-contain p-2"
                                                />
                                            ) : (
                                                <span className="text-2xl font-bold text-gray-500">
                                                    {candidate.name.charAt(0)}
                                                </span>
                                            )}

                                        </div>

                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                {candidate.name}
                                            </h3>

                                            <p className="text-sm text-gray-600">
                                                {candidate.party}
                                            </p>

                                            {candidate.biography && (
                                                <p className="mt-2 text-xs text-gray-500">
                                                    {candidate.biography}
                                                </p>
                                            )}
                                        </div>

                                    </label>

                                ))}

                            </div>

                            <button
                                onClick={handleVote}
                                disabled={!selectedCandidate || submitting}
                                className="mt-8 w-full rounded-lg bg-blue-600 py-4 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                                {submitting
                                    ? "Submitting Your Vote..."
                                    : "Submit My Vote"}
                            </button>

                            <p className="mt-4 text-center text-sm text-gray-500">
                                You can only vote once in this opinion poll.
                            </p>
                        </>

                    )}

                </section>

            </main>
        </div>
    );
}