"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Candidate {
    _id: string;
    name: string;
    party: string;
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
    election?: {
        title: string;
        category: string;
        state?: string;
    };
}

export default function PollsPage() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchPolls() {
            try {
                const response = await fetch("/api/votes", {
                    credentials: "include",
                    cache: "no-store",
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Unable to load opinion polls."
                    );
                }

                setPolls(data.polls || []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Something went wrong."
                );
            } finally {
                setLoading(false);
            }
        }

        fetchPolls();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Navigation */}
            <nav className="border-b bg-white px-6 py-5 shadow-sm">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">

                    <Link
                        href="/dashboard"
                        className="text-2xl font-bold text-blue-700"
                    >
                        VoteHub
                    </Link>

                    <div className="flex flex-wrap gap-5 text-sm font-medium text-gray-700">
                        <Link href="/dashboard" className="hover:text-blue-600">
                            Dashboard
                        </Link>

                        <Link
                            href="/polls"
                            className="font-bold text-blue-600"
                        >
                            Opinion Polls
                        </Link>

                        <Link href="/results" className="hover:text-blue-600">
                            Results
                        </Link>

                        <Link href="/profile" className="hover:text-blue-600">
                            Profile
                        </Link>
                    </div>

                </div>
            </nav>

            <main className="mx-auto max-w-6xl px-5 py-10">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Available Opinion Polls
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Explore active Nigerian election opinion polls and
                        make your voice heard.
                    </p>
                </div>

                {loading && (
                    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                        Loading available polls...
                    </div>
                )}

                {error && (
                    <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
                        {error}
                    </div>
                )}

                {!loading && !error && polls.length === 0 && (
                    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900">
                            No Active Polls
                        </h2>

                        <p className="mt-2 text-gray-600">
                            There are currently no active opinion polls.
                            Please check again later.
                        </p>
                    </div>
                )}

                {!loading && !error && polls.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                        {polls.map((poll) => (
                            <div
                                key={poll._id}
                                className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >

                                <div className="mb-4 flex items-center justify-between">
                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                        {poll.status}
                                    </span>

                                    <span className="text-xs text-gray-500">
                                        {poll.candidates?.length || 0} Candidates
                                    </span>
                                </div>

                                <h2 className="text-xl font-bold text-gray-900">
                                    {poll.title}
                                </h2>

                                <p className="mt-3 text-sm text-gray-600">
                                    {poll.question}
                                </p>

                                {poll.election && (
                                    <div className="mt-4 rounded-lg bg-blue-50 p-3">
                                        <p className="text-xs text-gray-500">
                                            Related Election
                                        </p>

                                        <p className="mt-1 font-semibold text-gray-900">
                                            {poll.election.title}
                                        </p>

                                        <p className="text-sm text-gray-600">
                                            {poll.election.category}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-4 space-y-1 border-t pt-4 text-sm text-gray-500">
                                    <p>
                                        Starts:{" "}
                                        {new Date(
                                            poll.startDate
                                        ).toLocaleDateString("en-NG")}
                                    </p>

                                    <p>
                                        Ends:{" "}
                                        {new Date(
                                            poll.endDate
                                        ).toLocaleDateString("en-NG")}
                                    </p>
                                </div>

                                <Link
                                    href={`/polls/${poll._id}`}
                                    className="mt-6 block rounded-lg bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-700"
                                >
                                    {poll.hasVoted
                                        ? "View Poll"
                                        : "Participate in Poll"}
                                </Link>

                            </div>
                        ))}

                    </div>
                )}

            </main>
        </div>
    );
}