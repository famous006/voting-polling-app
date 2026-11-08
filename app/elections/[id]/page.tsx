"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Candidate {
    _id: string;
    name: string;
    party: string;
    partyLogo?: string;
    profileImage?: string;
    biography?: string;
}

interface Poll {
    _id: string;
    title: string;
    question: string;
    status: string;
    startDate: string;
    endDate: string;
    candidates: Candidate[];
}

interface Election {
    _id: string;
    title: string;
    category: string;
    state: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
}

export default function ElectionDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [id, setId] = useState("");
    const [election, setElection] = useState<Election | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Get election ID from URL
    useEffect(() => {
        let cancelled = false;

        params.then((resolvedParams) => {
            if (!cancelled) {
                setId(resolvedParams.id);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [params]);

    // Fetch election details
    useEffect(() => {
        if (!id) return;

        async function fetchElectionDetails() {
            try {
                const response = await fetch(`/api/elections/${id}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Unable to load election details."
                    );
                }

                setElection(data.election);
                setCandidates(data.candidates || []);
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

        fetchElectionDetails();
    }, [id]);

    // Loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100">
                <p className="font-semibold text-slate-600">
                    Loading election details...
                </p>
            </div>
        );
    }

    // Error state
    if (error || !election) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6">
                <p className="text-red-600">
                    {error || "Election not found."}
                </p>

                <Link
                    href="/dashboard"
                    className="mt-5 rounded-lg bg-blue-600 px-6 py-3 text-white"
                >
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">

            {/* Navigation */}
            <nav className="border-b bg-white px-6 py-5 shadow-sm">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

                    <Link
                        href="/dashboard"
                        className="text-2xl font-bold text-blue-700"
                    >
                        VoteHub 🇳🇬
                    </Link>

                    <div className="flex flex-wrap items-center gap-5">
                        <Link
                            href="/dashboard"
                            className="text-slate-600 hover:text-blue-600"
                        >
                            Dashboard
                        </Link>

                        <Link
                            href="/polls"
                            className="text-slate-600 hover:text-blue-600"
                        >
                            Opinion Polls
                        </Link>

                        <Link
                            href="/results"
                            className="text-slate-600 hover:text-blue-600"
                        >
                            Results
                        </Link>

                        <Link
                            href="/profile"
                            className="text-slate-600 hover:text-blue-600"
                        >
                            Profile
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-6 py-10">

                {/* Back button */}
                <Link
                    href="/dashboard"
                    className="mb-6 inline-block font-semibold text-blue-600 hover:underline"
                >
                    ← Back to Elections
                </Link>

                {/* Election Information */}
                <section className="rounded-2xl bg-blue-700 p-8 text-white md:p-12">

                    <div className="mb-5 flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-white/20 px-4 py-2 text-sm">
                            {election.category}
                        </span>

                        <span className="rounded-full bg-white/20 px-4 py-2 text-sm">
                            {election.status}
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold md:text-4xl">
                        {election.title}
                    </h1>

                    <p className="mt-4 max-w-3xl text-blue-100">
                        {election.description || "No election description available."}
                    </p>

                    <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3">

                        <div>
                            <p className="text-sm text-blue-200">
                                Location
                            </p>

                            <p className="mt-1 font-semibold">
                                {election.state}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-blue-200">
                                Start Date
                            </p>

                            <p className="mt-1 font-semibold">
                                {new Date(election.startDate).toLocaleDateString("en-NG")}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-blue-200">
                                End Date
                            </p>

                            <p className="mt-1 font-semibold">
                                {new Date(election.endDate).toLocaleDateString("en-NG")}
                            </p>
                        </div>

                    </div>
                </section>

                {/* Election Statistics */}
                <section className="my-8 grid gap-6 sm:grid-cols-2">

                    <div className="rounded-xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Registered Candidates
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-slate-900">
                            {candidates.length}
                        </h2>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Opinion Polls
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-slate-900">
                            {polls.length}
                        </h2>
                    </div>

                </section>

                {/* Registered Candidates */}
                <section className="mb-12">

                    <h2 className="mb-6 text-2xl font-bold text-slate-900">
                        Registered Candidates
                    </h2>

                    {candidates.length === 0 ? (

                        <div className="rounded-xl bg-white p-8 text-center text-slate-500">
                            No candidates have been registered for this election yet.
                        </div>

                    ) : (

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                            {candidates.map((candidate) => (

                                <div
                                    key={candidate._id}
                                    className="rounded-xl bg-white p-6 shadow-sm"
                                >

                                    {candidate.profileImage ? (

                                        <img
                                            src={candidate.profileImage}
                                            alt={candidate.name}
                                            className="mb-4 h-24 w-24 rounded-full object-cover"
                                        />

                                    ) : (

                                        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
                                            {candidate.name.charAt(0).toUpperCase()}
                                        </div>

                                    )}

                                    <h3 className="text-xl font-bold text-slate-900">
                                        {candidate.name}
                                    </h3>

                                    <div className="mt-2 flex items-center gap-2">

                                        {candidate.partyLogo && (
                                            <img
                                                src={candidate.partyLogo}
                                                alt={candidate.party}
                                                className="h-8 w-8 object-contain"
                                            />
                                        )}

                                        <p className="font-medium text-blue-700">
                                            {candidate.party}
                                        </p>

                                    </div>

                                    {candidate.biography && (
                                        <p className="mt-4 text-sm text-slate-600">
                                            {candidate.biography}
                                        </p>
                                    )}

                                </div>

                            ))}

                        </div>

                    )}

                </section>

                {/* Related Opinion Polls */}
                <section>

                    <h2 className="mb-6 text-2xl font-bold text-slate-900">
                        Related Opinion Polls
                    </h2>

                    {polls.length === 0 ? (

                        <div className="rounded-xl bg-white p-8 text-center text-slate-500">
                            No opinion polls have been created for this election yet.
                        </div>

                    ) : (

                        <div className="grid gap-6 md:grid-cols-2">

                            {polls.map((poll) => (

                                <div
                                    key={poll._id}
                                    className="rounded-xl bg-white p-6 shadow-sm"
                                >

                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                        {poll.status}
                                    </span>

                                    <h3 className="mt-4 text-xl font-bold text-slate-900">
                                        {poll.title}
                                    </h3>

                                    <p className="mt-3 text-slate-600">
                                        {poll.question}
                                    </p>

                                    <p className="mt-4 text-sm text-slate-500">
                                        {poll.candidates?.length || 0} candidates included
                                    </p>

                                    <Link
                                        href={`/polls/${poll._id}`}
                                        className="mt-6 block rounded-lg bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-700"
                                    >
                                        View Poll Details
                                    </Link>

                                </div>

                            ))}

                        </div>

                    )}

                </section>

                {/* Footer */}
                <footer className="mt-16 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
                    VoteHub is an independent Nigerian election opinion polling platform. It is not an official voting platform.
                </footer>

            </main>

        </div>
    );
}