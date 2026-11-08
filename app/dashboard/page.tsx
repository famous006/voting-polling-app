"use client";

import { useState, useEffect } from "react";
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

export default function ClientDashboard() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [platformName, setPlatformName] = useState("VoteHub");
    const [logo, setLogo] = useState("");

    const [description, setDescription] = useState(
        "Explore Nigerian elections, learn about political candidates, participate in independent opinion polls and make your voice heard."
    );

    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");

    // Fetch available opinion polls
    useEffect(() => {
        async function fetchPolls() {
            try {
                setLoading(true);
                setError("");

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

    // Fetch platform settings
    useEffect(() => {
        async function fetchSettings() {
            try {
                const response = await fetch("/api/settings");
                const data = await response.json();

                if (response.ok && data.settings) {
                    setPlatformName(
                        data.settings.platformName || "VoteHub"
                    );

                    setLogo(data.settings.logo || "");

                    setDescription(
                        data.settings.description ||
                            "Explore Nigerian elections, learn about political candidates, participate in independent opinion polls and make your voice heard."
                    );

                    setContactEmail(data.settings.contactEmail || "");
                    setContactPhone(data.settings.contactPhone || "");
                }
            } catch (error) {
                console.error(
                    "Failed to load platform settings:",
                    error
                );
            }
        }

        fetchSettings();
    }, []);

    // Calculate participation
    const participatedPolls = polls.filter(
        (poll) => poll.hasVoted
    ).length;

    // Logout
    async function handleLogout() {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
            });

            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    return (
        <div className="min-h-screen bg-slate-100">

            {/* Navbar */}
            <nav className="border-b bg-white px-6 py-5 shadow-sm">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

                    <div className="flex items-center gap-2">
                        {logo && (
                            <img
                                src={logo}
                                alt={`${platformName} Logo`}
                                className="h-10 w-10 rounded-full object-contain"
                            />
                        )}

                        <h1 className="text-2xl font-bold text-slate-900">
                            {platformName}
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-5">
                        <Link
                            href="/dashboard"
                            className="font-semibold text-blue-600"
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

                        <button
                            onClick={handleLogout}
                            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-6 py-10">

                {/* Welcome Hero Section */}
                <section className="relative isolate mb-10 min-h-[350px] overflow-hidden rounded-2xl shadow-xl md:min-h-[380px]">

                    {/* Background Image */}
                    <div
                        className="absolute inset-0 -z-20 bg-cover bg-center"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1603032813605-2c91e257e2ae?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D')",
                        }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-blue-950/80 to-blue-900/55" />

                    {/* Additional Bottom Overlay */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/50 via-transparent to-blue-950/20" />

                    {/* Hero Content */}
                    <div className="flex min-h-[350px] flex-col justify-center p-8 text-white md:min-h-[380px] md:p-12">

                        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                            Welcome to {platformName} 🇳🇬
                        </p>

                        <h2 className="max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">
                            Your Voice.
                            <span className="text-blue-300"> Your Choice.</span>
                            <br />
                            Your Future.
                        </h2>

                        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                            {description}
                        </p>

                        <a
                            href="#polls"
                            className="mt-8 w-fit rounded-lg bg-white px-7 py-3.5 font-bold text-blue-800 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-xl"
                        >
                            Explore Opinion Polls →
                        </a>

                    </div>
                </section>

                {/* Dashboard Statistics */}
                <section className="mb-10 grid gap-6 sm:grid-cols-3">

                    <div className="rounded-xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Available Polls
                        </p>

                        <h3 className="mt-2 text-3xl font-bold text-slate-800">
                            {polls.length}
                        </h3>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Your Participation
                        </p>

                        <h3 className="mt-2 text-3xl font-bold text-slate-800">
                            {participatedPolls}
                        </h3>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Active Polls
                        </p>

                        <h3 className="mt-2 text-3xl font-bold text-slate-800">
                            {polls.filter(
                                (poll) => poll.status === "Active"
                            ).length}
                        </h3>
                    </div>

                </section>

                {/* Available Opinion Polls */}
                <section id="polls">

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                Available Opinion Polls
                            </h2>

                            <p className="mt-2 text-slate-500">
                                Explore active polls and make your voice heard.
                            </p>
                        </div>

                        <Link
                            href="/polls"
                            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            View All Polls
                        </Link>

                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="rounded-xl bg-white p-10 text-center">
                            <p className="font-semibold text-slate-600">
                                Loading available polls...
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">
                            {error}
                        </div>
                    )}

                    {/* No Polls */}
                    {!loading && !error && polls.length === 0 && (
                        <div className="rounded-xl bg-white p-10 text-center shadow-sm">

                            <h3 className="text-xl font-bold text-slate-800">
                                No Active Polls
                            </h3>

                            <p className="mt-2 text-slate-500">
                                There are currently no active opinion polls.
                                Please check again later.
                            </p>

                        </div>
                    )}

                    {/* Poll Cards */}
                    {!loading && !error && polls.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

                            {polls.map((poll) => (
                                <div
                                    key={poll._id}
                                    className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >

                                    <div className="mb-4 flex items-center justify-between gap-2">

                                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                            {poll.status}
                                        </span>

                                        <span className="text-xs text-slate-500">
                                            {poll.candidates?.length || 0} Candidates
                                        </span>

                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800">
                                        {poll.title}
                                    </h3>

                                    <p className="mt-3 text-sm text-slate-600">
                                        {poll.question}
                                    </p>

                                    {poll.election && (
                                        <div className="mt-4 rounded-lg bg-blue-50 p-4">

                                            <p className="text-xs text-slate-500">
                                                Related Election
                                            </p>

                                            <h4 className="mt-1 font-semibold text-slate-800">
                                                {poll.election.title}
                                            </h4>

                                            <p className="text-sm text-slate-600">
                                                {poll.election.category}
                                                {poll.election.state
                                                    ? ` • ${poll.election.state}`
                                                    : ""}
                                            </p>

                                        </div>
                                    )}

                                    <div className="mt-4 border-t pt-4 text-sm text-slate-500">

                                        <p>
                                            Starts:{" "}
                                            {new Date(
                                                poll.startDate
                                            ).toLocaleDateString("en-NG")}
                                        </p>

                                        <p className="mt-1">
                                            Ends:{" "}
                                            {new Date(
                                                poll.endDate
                                            ).toLocaleDateString("en-NG")}
                                        </p>

                                    </div>

                                    <Link
                                        href={`/polls/${poll._id}`}
                                        className={`mt-6 block w-full rounded-lg py-3 text-center font-semibold text-white ${
                                            poll.hasVoted
                                                ? "bg-green-600 hover:bg-green-700"
                                                : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                    >
                                        {poll.hasVoted
                                            ? "View Poll"
                                            : "Participate in Poll"}
                                    </Link>

                                </div>
                            ))}

                        </div>
                    )}

                </section>

                {/* Footer */}
                <footer className="mt-12 border-t pt-6 text-center text-sm text-slate-500">

                    <p>
                        {platformName} © 2026. An independent Nigerian election opinion polling platform.
                    </p>

                    <p className="mt-2">
                        {platformName} is not an official INEC voting platform.
                    </p>

                    {(contactEmail || contactPhone) && (
                        <div className="mt-4 flex flex-wrap justify-center gap-5">

                            {contactEmail && (
                                <a
                                    href={`mailto:${contactEmail}`}
                                    className="hover:text-blue-600"
                                >
                                    Email: {contactEmail}
                                </a>
                            )}

                            {contactPhone && (
                                <a
                                    href={`tel:${contactPhone}`}
                                    className="hover:text-blue-600"
                                >
                                    Phone: {contactPhone}
                                </a>
                            )}

                        </div>
                    )}

                </footer>

            </main>
        </div>
    );
}