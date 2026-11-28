"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Poll {
    _id: string;
    title: string;
    question: string;
    status: string;
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
    success: boolean;
    poll?: {
        _id: string;
        title: string;
        question: string;
        status: string;
    };
    totalVotes: number;
    results: CandidateResult[];
    message?: string;
}

export default function AdminResultsPage() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [selectedPoll, setSelectedPoll] = useState("");
    const [resultsData, setResultsData] = useState<ResultsData | null>(null);

    const [loadingPolls, setLoadingPolls] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Fetch polls
    useEffect(() => {
        const fetchPolls = async () => {
            try {
                const response = await fetch("/api/admin/polls");
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Unable to fetch polls.");
                }

                setPolls(data.polls || []);

                if (data.polls?.length > 0) {
                    setSelectedPoll(data.polls[0]._id);
                }
            } catch (err) {
                console.error("Fetch polls error:", err);
                setError("Unable to load opinion polls.");
            } finally {
                setLoadingPolls(false);
            }
        };

        fetchPolls();
    }, []);

    // Fetch results
    const fetchResults = useCallback(async (manual = false) => {
        if (!selectedPoll) return;

        try {
            if (manual) {
                setRefreshing(true);
            } else {
                setLoadingResults(true);
            }

            setError("");

            const response = await fetch(
                `/api/results?pollId=${selectedPoll}`,
                { cache: "no-store" }
            );

            const data: ResultsData = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to fetch results.");
            }

            setResultsData(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Fetch results error:", err);
            setError("Unable to load poll results. Please try again.");
        } finally {
            setLoadingResults(false);
            setRefreshing(false);
        }
    }, [selectedPoll]);

    // Initial fetch and automatic refresh
    useEffect(() => {
        if (!selectedPoll) return;

        fetchResults();

        const interval = setInterval(() => {
            fetchResults();
        }, 15000);

        return () => clearInterval(interval);
    }, [selectedPoll, fetchResults]);

    const leadingCandidate = resultsData?.results?.[0];
    const secondCandidate = resultsData?.results?.[1];
    const thirdCandidate = resultsData?.results?.[2];

    // Logout
    const handleLogout = async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
            });

            if (response.ok) {
                window.location.href = "/login";
            }
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Podium card
    const PodiumCard = ({
        candidate,
        rank,
    }: {
        candidate: CandidateResult | undefined;
        rank: number;
    }) => {
        if (!candidate) return null;

        const rankStyles: Record<number, string> = {
            1: "border-yellow-300 bg-yellow-50",
            2: "border-slate-300 bg-slate-50",
            3: "border-orange-300 bg-orange-50",
        };

        const rankColors: Record<number, string> = {
            1: "bg-yellow-400 text-yellow-950",
            2: "bg-slate-300 text-slate-800",
            3: "bg-orange-300 text-orange-950",
        };

        const rankIcons: Record<number, string> = {
            1: "🥇",
            2: "🥈",
            3: "🥉",
        };

        return (
            <div
                className={`rounded-2xl border p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${rankStyles[rank]}`}
            >
                <div
                    className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl ${rankColors[rank]}`}
                >
                    {rankIcons[rank]}
                </div>

                {candidate.profileImage ? (
                    <img
                        src={candidate.profileImage}
                        alt={candidate.name}
                        className="mx-auto mb-4 h-20 w-20 rounded-full border-4 border-white object-cover shadow"
                    />
                ) : (
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-500 shadow">
                        {candidate.name.charAt(0).toUpperCase()}
                    </div>
                )}

                {candidate.partyLogo && (
                    <img
                        src={candidate.partyLogo}
                        alt={candidate.party}
                        className="mx-auto mb-2 h-10 w-10 rounded-full object-cover"
                    />
                )}

                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {rank === 1 ? "Leading Candidate" : `${rank}${rank === 2 ? "nd" : "rd"} Place`}
                </p>

                <h3 className="text-lg font-bold text-slate-800">
                    {candidate.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    {candidate.party}
                </p>

                <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-3xl font-extrabold text-slate-800">
                        {candidate.votes.toLocaleString()}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">Votes</p>

                    <div className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-600 shadow-sm">
                        {candidate.percentage}%
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-100 md:flex">

            {/* SIDEBAR */}
            <aside className="flex w-full flex-col bg-slate-950 p-6 text-white md:min-h-screen md:w-64">

                <h1 className="mb-10 text-2xl font-bold">
                    Vote<span className="text-blue-400">Hub</span>
                </h1>

                <nav className="flex-1 space-y-3">
                    {[
                        { name: "📊 Dashboard", path: "/admin/dashboard" },
                        { name: "🗳️ Elections", path: "/admin/elections" },
                        { name: "🏛️ Political Parties", path: "/admin/parties" },
                        { name: "👤 Candidates", path: "/admin/candidates" },
                        { name: "📈 Opinion Polls", path: "/admin/polls" },
                        { name: "📋 Results & Analytics", path: "/admin/results" },
                        { name: "👥 Users", path: "/admin/users" },
                        { name: "📜 Activity Logs", path: "/admin/activity-logs" },
                        { name: "🛡️ Admin Management", path: "/admin/admin-management" },
                        { name: "⚙️ Settings", path: "/admin/settings" },
                    ].map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`block rounded-lg p-3 transition ${
                                item.path === "/admin/results"
                                    ? "bg-blue-600"
                                    : "hover:bg-slate-800"
                            }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <button
                    onClick={handleLogout}
                    className="mt-10 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                    🚪 Logout
                </button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">

                {/* HEADER */}
                <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">
                            Results & Analytics
                        </h2>

                        <p className="mt-2 text-slate-500">
                            Monitor candidate performance and voting statistics.
                        </p>

                        {lastUpdated && (
                            <p className="mt-2 text-xs text-slate-400">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Live Indicator */}
                        <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2">
                            <span className="relative flex h-3 w-3">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                            </span>

                            <span className="text-sm font-semibold text-green-700">
                                Live Results
                            </span>
                        </div>

                        {/* Manual Refresh */}
                        <button
                            onClick={() => fetchResults(true)}
                            disabled={!selectedPoll || refreshing}
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className={refreshing ? "animate-spin" : ""}>
                                🔄
                            </span>
                            {refreshing ? "Refreshing..." : "Refresh Results"}
                        </button>
                    </div>
                </header>

                {/* POLL SELECTOR */}
                <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
                    <label className="mb-2 block font-semibold text-slate-700">
                        Select Opinion Poll
                    </label>

                    {loadingPolls ? (
                        <p className="text-slate-500">Loading polls...</p>
                    ) : polls.length === 0 ? (
                        <div className="rounded-lg bg-slate-50 p-4 text-slate-500">
                            No opinion polls available.
                        </div>
                    ) : (
                        <select
                            value={selectedPoll}
                            onChange={(e) => {
                                setSelectedPoll(e.target.value);
                                setResultsData(null);
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-800 outline-none focus:border-blue-500 md:max-w-xl"
                        >
                            {polls.map((poll) => (
                                <option key={poll._id} value={poll._id}>
                                    {poll.title}
                                </option>
                            ))}
                        </select>
                    )}
                </section>

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                        <p>{error}</p>

                        <button
                            onClick={() => fetchResults(true)}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* LOADING */}
                {loadingResults && !resultsData && (
                    <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                        <p className="font-medium text-slate-500">
                            Loading election results...
                        </p>
                    </div>
                )}

                {/* RESULTS */}
                {!loadingResults && resultsData && (
                    <>
                        {/* STATISTICS */}
                        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

                            {/* Total Votes */}
                            <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-slate-500">
                                        Total Votes
                                    </p>
                                    <span className="text-3xl">🗳️</span>
                                </div>

                                <h3 className="mt-3 text-4xl font-extrabold text-slate-800">
                                    {resultsData.totalVotes.toLocaleString()}
                                </h3>

                                <p className="mt-2 text-sm text-blue-600">
                                    Total votes recorded
                                </p>
                            </div>

                            {/* Candidates */}
                            <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-slate-500">
                                        Total Candidates
                                    </p>
                                    <span className="text-3xl">👥</span>
                                </div>

                                <h3 className="mt-3 text-4xl font-extrabold text-slate-800">
                                    {resultsData.results.length}
                                </h3>

                                <p className="mt-2 text-sm text-blue-600">
                                    Candidates contesting
                                </p>
                            </div>

                            {/* Leader */}
                            <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-slate-500">
                                        Leading Candidate
                                    </p>
                                    <span className="text-3xl">🏆</span>
                                </div>

                                <h3 className="mt-3 text-2xl font-extrabold text-slate-800">
                                    {leadingCandidate?.name || "No votes yet"}
                                </h3>

                                <p className="mt-2 text-sm text-green-600">
                                    {leadingCandidate
                                        ? `${leadingCandidate.percentage}% of total votes`
                                        : "Waiting for votes"}
                                </p>
                            </div>
                        </section>

                        {/* TOP THREE PODIUM */}
                        {resultsData.totalVotes > 0 &&
                            resultsData.results.length > 0 && (
                                <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-slate-800">
                                            🏆 Top Candidates
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Candidates currently leading this poll.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                        <PodiumCard
                                            candidate={leadingCandidate}
                                            rank={1}
                                        />

                                        <PodiumCard
                                            candidate={secondCandidate}
                                            rank={2}
                                        />

                                        <PodiumCard
                                            candidate={thirdCandidate}
                                            rank={3}
                                        />
                                    </div>
                                </section>
                            )}

                        {/* VOTE DISTRIBUTION */}
                        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">
                                        Vote Distribution
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Visual comparison of candidate votes.
                                    </p>
                                </div>
                            </div>

                            {resultsData.results.length === 0 ? (
                                <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
                                    No candidates found for this poll.
                                </div>
                            ) : resultsData.totalVotes === 0 ? (
                                <div className="rounded-xl bg-slate-50 p-8 text-center">
                                    <div className="mb-3 text-4xl">🗳️</div>
                                    <p className="font-semibold text-slate-700">
                                        No votes have been cast yet.
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Results will appear here when voting begins.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-7">
                                    {resultsData.results.map((candidate, index) => (
                                        <div key={candidate.candidateId}>
                                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                                            index === 0
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {index === 0 ? "🥇" : index + 1}
                                                    </span>

                                                    {candidate.profileImage ? (
                                                        <img
                                                            src={candidate.profileImage}
                                                            alt={candidate.name}
                                                            className="h-11 w-11 rounded-full object-cover"
                                                        />
                                                    ) : candidate.partyLogo ? (
                                                        <img
                                                            src={candidate.partyLogo}
                                                            alt={candidate.party}
                                                            className="h-11 w-11 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                                            {candidate.name.charAt(0)}
                                                        </div>
                                                    )}

                                                    <div className="min-w-0">
                                                        <p className="truncate font-bold text-slate-800">
                                                            {candidate.name}
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            {candidate.party}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="font-bold text-slate-800">
                                                        {candidate.votes.toLocaleString()} votes
                                                    </p>

                                                    <p className="text-sm font-semibold text-blue-600">
                                                        {candidate.percentage}%
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                        index === 0
                                                            ? "bg-yellow-500"
                                                            : "bg-blue-600"
                                                    }`}
                                                    style={{
                                                        width: `${Math.max(candidate.percentage, 0)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* DETAILED RESULTS TABLE */}
                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-800">
                                    Detailed Candidate Results
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Complete ranking and voting statistics.
                                </p>
                            </div>

                            {resultsData.results.length === 0 ? (
                                <p className="py-8 text-center text-slate-500">
                                    No candidates are available for this poll.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[650px] text-left">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                                <th className="p-4">Rank</th>
                                                <th className="p-4">Candidate</th>
                                                <th className="p-4">Party</th>
                                                <th className="p-4">Votes</th>
                                                <th className="p-4">Percentage</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {resultsData.results.map((candidate, index) => (
                                                <tr
                                                    key={candidate.candidateId}
                                                    className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                                                        index === 0 && resultsData.totalVotes > 0
                                                            ? "bg-yellow-50/60"
                                                            : ""
                                                    }`}
                                                >
                                                    <td className="p-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                                                                index === 0 && resultsData.totalVotes > 0
                                                                    ? "bg-yellow-100 text-yellow-700"
                                                                    : "bg-slate-100 text-slate-600"
                                                            }`}
                                                        >
                                                            {index === 0 && resultsData.totalVotes > 0
                                                                ? "🥇 1st"
                                                                : `#${index + 1}`}
                                                        </span>
                                                    </td>

                                                    <td className="p-4 font-semibold text-slate-800">
                                                        {candidate.name}
                                                    </td>

                                                    <td className="p-4 text-slate-600">
                                                        {candidate.party}
                                                    </td>

                                                    <td className="p-4 font-bold text-slate-800">
                                                        {candidate.votes.toLocaleString()}
                                                    </td>

                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-semibold text-blue-600">
                                                                {candidate.percentage}%
                                                            </span>

                                                            <div className="hidden h-2 w-20 overflow-hidden rounded-full bg-slate-100 sm:block">
                                                                <div
                                                                    className="h-full rounded-full bg-blue-600"
                                                                    style={{
                                                                        width: `${Math.max(candidate.percentage, 0)}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* FOOTER */}
                <footer className="mt-10 text-center text-sm text-slate-400">
                    VoteHub © 2026 · Nigerian Election Opinion Polling Platform
                </footer>

            </main>
        </div>
    );
}