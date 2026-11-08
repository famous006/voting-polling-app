"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Candidate {
    _id: string;
    name: string;
    party: string;
    partyLogo?: string;
    profileImage?: string;
}

interface Poll {
    _id: string;
    title: string;
    question: string;
    status: string;
    candidates: Candidate[];
    hasVoted: boolean;
}

interface Election {
    title: string;
    category: string;
    state?: string;
}

interface PollResult {
    _id: string;
    title: string;
    question: string;
    status: string;
    election?: Election;
}

interface CandidateResult {
    candidateId: string;
    name: string;
    party: string;
    partyLogo?: string;
    profileImage?: string;
    votes: number;
    percentage: number;
}

interface ResultsData {
    poll: PollResult;
    totalVotes: number;
    results: CandidateResult[];
}

export default function ResultsPage() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [selectedPoll, setSelectedPoll] = useState("");
    const [results, setResults] = useState<ResultsData | null>(null);

    const [loadingPolls, setLoadingPolls] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);

    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Fetch available polls
    useEffect(() => {
        const fetchPolls = async () => {
            try {
                setLoadingPolls(true);
                setError("");

                const response = await fetch("/api/votes", {
                    credentials: "include",
                    cache: "no-store",
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Unable to load polls."
                    );
                }

                setPolls(data.polls || []);

                if (data.polls?.length > 0) {
                    setSelectedPoll(data.polls[0]._id);
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load polls."
                );
            } finally {
                setLoadingPolls(false);
            }
        };

        fetchPolls();
    }, []);

    // Fetch and automatically refresh selected poll results
    useEffect(() => {
        if (!selectedPoll) {
            setResults(null);
            return;
        }

        let isActive = true;

        const fetchResults = async (showLoading = false) => {
            try {
                if (showLoading && isActive) {
                    setLoadingResults(true);
                }

                const response = await fetch(
                    `/api/results?pollId=${selectedPoll}`,
                    {
                        credentials: "include",
                        cache: "no-store",
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Unable to fetch poll results."
                    );
                }

                if (isActive) {
                    setResults(data);
                    setLastUpdated(new Date());
                    setError("");
                }
            } catch (err) {
                if (isActive) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to fetch results."
                    );
                }
            } finally {
                if (showLoading && isActive) {
                    setLoadingResults(false);
                }
            }
        };

        // Initial fetch
        fetchResults(true);

        // Automatically refresh every 10 seconds
        const refreshInterval = setInterval(() => {
            fetchResults(false);
        }, 10000);

        return () => {
            isActive = false;
            clearInterval(refreshInterval);
        };
    }, [selectedPoll]);

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

                    <div className="flex flex-wrap gap-5 text-sm font-medium text-gray-700">

                        <Link
                            href="/dashboard"
                            className="hover:text-blue-600"
                        >
                            Dashboard
                        </Link>

                        <Link
                            href="/results"
                            className="font-bold text-blue-600"
                        >
                            Results
                        </Link>

                        <Link
                            href="/profile"
                            className="hover:text-blue-600"
                        >
                            Profile
                        </Link>

                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-6xl px-5 py-10">

                {/* Page Heading */}
                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Election Poll Results
                    </h1>

                    <p className="mt-2 text-gray-600">
                        View voting statistics, candidate performance and
                        opinion poll results.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-green-700">

                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>

                        Automatically updating every 10 seconds

                    </div>

                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {/* Poll Selection */}
                <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">

                    <label className="mb-3 block font-semibold text-gray-900">
                        Select an Opinion Poll
                    </label>

                    {loadingPolls ? (
                        <p className="text-gray-600">
                            Loading available polls...
                        </p>
                    ) : polls.length === 0 ? (
                        <p className="text-gray-600">
                            No active polls are currently available.
                        </p>
                    ) : (
                        <select
                            value={selectedPoll}
                            onChange={(e) =>
                                setSelectedPoll(e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
                        >
                            {polls.map((poll) => (
                                <option
                                    key={poll._id}
                                    value={poll._id}
                                >
                                    {poll.title}
                                </option>
                            ))}
                        </select>
                    )}

                </div>

                {/* Loading Results */}
                {loadingResults && (
                    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                        <p className="font-semibold text-gray-700">
                            Loading poll results...
                        </p>
                    </div>
                )}

                {/* Results */}
                {!loadingResults && results && (
                    <>

                        {/* Poll Information */}
                        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">

                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

                                <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                                    {results.poll.status}
                                </span>

                                <span className="text-sm text-gray-500">
                                    Opinion Poll
                                </span>

                            </div>

                            <h2 className="text-2xl font-bold text-gray-900">
                                {results.poll.title}
                            </h2>

                            <p className="mt-3 text-gray-600">
                                {results.poll.question}
                            </p>

                            {results.poll.election && (
                                <div className="mt-5 rounded-lg bg-blue-50 p-4">

                                    <p className="text-sm text-gray-500">
                                        Related Election
                                    </p>

                                    <p className="mt-1 font-semibold text-gray-900">
                                        {results.poll.election.title}
                                    </p>

                                    <p className="text-sm text-gray-600">
                                        {results.poll.election.category}
                                        {results.poll.election.state
                                            ? ` • ${results.poll.election.state}`
                                            : ""}
                                    </p>

                                </div>
                            )}

                        </div>

                        {/* Statistics */}
                        <div className="mb-8 grid gap-5 sm:grid-cols-2">

                            <div className="rounded-xl bg-white p-6 shadow-sm">

                                <p className="text-sm font-medium text-gray-500">
                                    Total Votes
                                </p>

                                <h2 className="mt-3 text-3xl font-bold text-blue-700">
                                    {results.totalVotes.toLocaleString()}
                                </h2>

                            </div>

                            <div className="rounded-xl bg-white p-6 shadow-sm">

                                <p className="text-sm font-medium text-gray-500">
                                    Number of Candidates
                                </p>

                                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                                    {results.results.length}
                                </h2>

                            </div>

                        </div>

                        {/* Candidate Results */}
                        <div className="rounded-xl bg-white p-6 shadow-sm">

                            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

                                <h2 className="text-2xl font-bold text-gray-900">
                                    Candidate Performance
                                </h2>

                                {lastUpdated && (
                                    <p className="text-xs text-gray-500">
                                        Last updated:{" "}
                                        {lastUpdated.toLocaleTimeString()}
                                    </p>
                                )}

                            </div>

                            {results.results.length === 0 ? (

                                <p className="py-8 text-center text-gray-500">
                                    No voting results are available for this poll yet.
                                </p>

                            ) : (

                                <div className="space-y-6">

                                    {results.results.map((candidate, index) => (

                                        <div
                                            key={candidate.candidateId}
                                            className="rounded-xl border border-gray-200 p-5"
                                        >

                                            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">

                                                <div className="flex items-center gap-4">

                                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                                        {index + 1}
                                                    </span>

                                                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-100">

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
                                                            <span className="text-xl font-bold text-gray-500">
                                                                {candidate.name.charAt(0)}
                                                            </span>
                                                        )}

                                                    </div>

                                                    <div>

                                                        <h3 className="font-bold text-gray-900">
                                                            {candidate.name}
                                                        </h3>

                                                        <p className="text-sm text-gray-500">
                                                            {candidate.party}
                                                        </p>

                                                    </div>

                                                </div>

                                                <div className="text-right">

                                                    <p className="text-xl font-bold text-gray-900">
                                                        {candidate.votes.toLocaleString()}
                                                    </p>

                                                    <p className="text-sm text-gray-500">
                                                        Votes
                                                    </p>

                                                </div>

                                            </div>

                                            {/* Voting Percentage */}
                                            <div className="mb-2 flex justify-between text-sm font-semibold text-gray-700">

                                                <span>
                                                    Voting Percentage
                                                </span>

                                                <span>
                                                    {candidate.percentage}%
                                                </span>

                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">

                                                <div
                                                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            Math.max(
                                                                0,
                                                                candidate.percentage
                                                            )
                                                        )}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            )}

                        </div>

                        {/* Disclaimer */}
                        <p className="mt-6 text-center text-sm text-gray-500">
                            VoteHub provides independent opinion polling
                            statistics. These results are not official
                            Nigerian election results.
                        </p>

                    </>
                )}

            </main>
        </div>
    );
}