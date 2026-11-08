"use client";

import { useEffect, useState } from "react";

interface CandidateResult {
    candidateId: string;
    name: string;
    party: string;
    partyLogo?: string;
    profileImage?: string;
    votes: number;
    percentage: number;
}

interface Poll {
    _id: string;
    title: string;
    question: string;
    status: string;
}

interface ResultsData {
    poll: {
        _id: string;
        title: string;
        question: string;
        status: string;
        election: {
            title: string;
            category: string;
            state: string;
        } | null;
    };
    totalVotes: number;
    results: CandidateResult[];
}

export default function ResultsPage() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [selectedPoll, setSelectedPoll] = useState("");
    const [results, setResults] = useState<ResultsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch available polls
    useEffect(() => {
        const fetchPolls = async () => {
            try {
                const response = await fetch("/api/available-polls", {
                    cache: "no-store",
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to fetch polls.");
                }

                setPolls(data.polls || []);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Unable to load polls."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPolls();
    }, []);

    // Fetch selected poll results
    useEffect(() => {
        if (!selectedPoll) {
            setResults(null);
            return;
        }

        const fetchResults = async () => {
            try {
                setResultsLoading(true);
                setError("");

                const response = await fetch(
                    `/api/results?pollId=${selectedPoll}`,
                    { cache: "no-store" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to fetch results.");
                }

                setResults(data);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Unable to load results."
                );
                setResults(null);
            } finally {
                setResultsLoading(false);
            }
        };

        fetchResults();
    }, [selectedPoll]);

    const leader = results?.results[0];

    return (
        <div className="min-h-screen bg-slate-50 p-5 text-black md:p-8">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        Results & Analytics
                    </h1>

                    <p className="mt-2 text-sm text-slate-600">
                        Explore opinion poll results and candidate performance.
                    </p>
                </div>

                {/* Poll Selection */}
                <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
                    <label className="mb-3 block font-semibold">
                        Select an Opinion Poll
                    </label>

                    {loading ? (
                        <p className="text-sm text-slate-500">
                            Loading polls...
                        </p>
                    ) : polls.length > 0 ? (
                        <select
                            value={selectedPoll}
                            onChange={(e) => setSelectedPoll(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 md:max-w-xl"
                        >
                            <option value="">Choose a poll</option>

                            {polls.map((poll) => (
                                <option key={poll._id} value={poll._id}>
                                    {poll.title}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-sm text-slate-500">
                            No opinion polls are available.
                        </p>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Results */}
                {resultsLoading ? (
                    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                        Loading poll results...
                    </div>
                ) : results ? (
                    <>
                        {/* Poll Information */}
                        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                    {results.poll.election?.category || "Opinion Poll"}
                                </span>

                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                    {results.poll.status}
                                </span>
                            </div>

                            <h2 className="text-2xl font-bold">
                                {results.poll.title}
                            </h2>

                            <p className="mt-2 text-sm text-slate-600">
                                {results.poll.question}
                            </p>

                            {results.poll.election && (
                                <p className="mt-3 text-xs text-slate-500">
                                    {results.poll.election.title} ·{" "}
                                    {results.poll.election.state}
                                </p>
                            )}
                        </div>

                        {/* Statistics */}
                        <div className="mb-8 grid gap-5 sm:grid-cols-2">
                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <p className="text-sm text-slate-500">
                                    Total Votes
                                </p>

                                <h3 className="mt-2 text-3xl font-bold text-blue-600">
                                    {results.totalVotes.toLocaleString()}
                                </h3>
                            </div>

                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <p className="text-sm text-slate-500">
                                    Number of Candidates
                                </p>

                                <h3 className="mt-2 text-3xl font-bold text-blue-600">
                                    {results.results.length}
                                </h3>
                            </div>
                        </div>

                        {/* Leading Candidate */}
                        {leader && results.totalVotes > 0 && (
                            <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-6">
                                <p className="text-sm font-semibold text-green-700">
                                    CURRENT LEADER
                                </p>

                                <h3 className="mt-2 text-2xl font-bold">
                                    {leader.name}
                                </h3>

                                <p className="mt-1 text-sm text-slate-600">
                                    {leader.party}
                                </p>

                                <p className="mt-3 text-3xl font-bold text-green-700">
                                    {leader.percentage}%
                                </p>
                            </div>
                        )}

                        {/* Candidate Results */}
                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <h2 className="mb-6 text-xl font-bold">
                                Candidate Performance
                            </h2>

                            {results.results.map((candidate, index) => (
                                <div
                                    key={candidate.candidateId}
                                    className="mb-7 last:mb-0"
                                >
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {candidate.profileImage ? (
                                                <img
                                                    src={candidate.profileImage}
                                                    alt={candidate.name}
                                                    className="h-12 w-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-bold">
                                                    {candidate.name.charAt(0)}
                                                </div>
                                            )}

                                            <div>
                                                <p className="font-semibold">
                                                    {index === 0 && results.totalVotes > 0
                                                        ? "🏆 "
                                                        : ""}
                                                    {candidate.name}
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    {candidate.party}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold">
                                                {candidate.votes.toLocaleString()} votes
                                            </p>

                                            <p className="text-sm text-blue-600">
                                                {candidate.percentage}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                                            style={{
                                                width: `${candidate.percentage}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}

                            {results.results.length === 0 && (
                                <p className="text-center text-sm text-slate-500">
                                    No candidates are available for this poll.
                                </p>
                            )}
                        </div>

                        <p className="mt-6 text-center text-xs text-slate-500">
                            These figures represent independent opinion poll responses,
                            not official election results.
                        </p>
                    </>
                ) : !loading && !selectedPoll ? (
                    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                        <h2 className="text-xl font-semibold">
                            Select a Poll to View Results
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Choose an opinion poll above to explore its results.
                        </p>
                    </div>
                ) : null}

            </div>
        </div>
    );
}