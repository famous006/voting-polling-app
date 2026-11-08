"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const electionCategories = [
    {
        title: "Presidential",
        category: "Presidential",
        description: "Presidential election polls",
        icon: "🏛️",
    },
    {
        title: "Governorship",
        category: "Governorship",
        description: "State governorship polls",
        icon: "🏢",
    },
    {
        title: "Senatorial",
        category: "Senatorial",
        description: "Senatorial district polls",
        icon: "⚖️",
    },
    {
        title: "House of Reps",
        category: "House of Representatives",
        description: "Federal constituency polls",
        icon: "🏛️",
    },
    {
        title: "State Assembly",
        category: "State Assembly",
        description: "State constituency polls",
        icon: "📜",
    },
];

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
    status: string;
    participantCount: number;
    createdAt: string;
    election?: Election;
}

interface ElectionData {
    _id: string;
    title: string;
    category: string;
    state: string;
    status: string;
}

export default function Dashboard() {
    // Logged-in user's role
    const [userRole, setUserRole] = useState<string | null>(null);

    // Dashboard statistics
    const [stats, setStats] = useState([
        { title: "Total Elections", value: "0", icon: "🗳️" },
        { title: "Total Participants", value: "0", icon: "👥" },
        { title: "Active Opinion Polls", value: "0", icon: "📊" },
        { title: "Registered Users", value: "0", icon: "🇳🇬" },
    ]);

    const [loadingStats, setLoadingStats] = useState(true);

    // Election category counts
    const [categoryCounts, setCategoryCounts] = useState<
        Record<string, number>
    >({});

    const [loadingCategories, setLoadingCategories] = useState(true);

    // Recent opinion polls
    const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
    const [loadingPolls, setLoadingPolls] = useState(true);

    // Fetch logged-in user's role
    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const response = await fetch("/api/auth/me");
                const data = await response.json();

                if (data.success) {
                    setUserRole(data.role);
                }
            } catch (error) {
                console.error("Failed to fetch user role:", error);
            }
        };

        fetchUserRole();
    }, []);

    // Fetch real dashboard statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("/api/admin/stats");

                if (!response.ok) {
                    throw new Error("Failed to fetch dashboard statistics");
                }

                const data = await response.json();

                if (data.success) {
                    setStats([
                        {
                            title: "Total Elections",
                            value: data.stats.totalElections.toLocaleString(),
                            icon: "🗳️",
                        },
                        {
                            title: "Total Participants",
                            value: data.stats.totalParticipants.toLocaleString(),
                            icon: "👥",
                        },
                        {
                            title: "Active Opinion Polls",
                            value: data.stats.activeOpinionPolls.toLocaleString(),
                            icon: "📊",
                        },
                        {
                            title: "Registered Users",
                            value: data.stats.registeredUsers.toLocaleString(),
                            icon: "🇳🇬",
                        },
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard statistics:", error);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, []);

    // Fetch elections and calculate category counts
    useEffect(() => {
        const fetchCategoryCounts = async () => {
            try {
                const response = await fetch("/api/admin/elections");

                if (!response.ok) {
                    throw new Error("Failed to fetch elections");
                }

                const data = await response.json();

                if (data.success) {
                    const elections: ElectionData[] = data.elections;

                    const counts: Record<string, number> = {};

                    elections.forEach((election) => {
                        counts[election.category] =
                            (counts[election.category] || 0) + 1;
                    });

                    setCategoryCounts(counts);
                }
            } catch (error) {
                console.error("Failed to fetch category counts:", error);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategoryCounts();
    }, []);

    // Fetch recent opinion polls
    useEffect(() => {
        const fetchRecentPolls = async () => {
            try {
                const response = await fetch("/api/admin/polls");

                if (!response.ok) {
                    throw new Error("Failed to fetch opinion polls");
                }

                const data = await response.json();

                if (data.success) {
                    const polls: Poll[] = data.polls;

                    // Latest four polls
                    setRecentPolls(polls.slice(0, 4));
                }
            } catch (error) {
                console.error("Failed to fetch recent polls:", error);
            } finally {
                setLoadingPolls(false);
            }
        };

        fetchRecentPolls();
    }, []);

    // Logout function
    const handleLogout = async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
            });

            if (response.ok) {
                window.location.href = "/login";
            } else {
                alert("Unable to logout. Please try again.");
            }
        } catch (error) {
            console.error("Logout error:", error);
            alert("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 md:flex">

            {/* Sidebar */}
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

                        ...(userRole === "superadmin"
                            ? [
                                {
                                    name: "🛡️ Admin Management",
                                    path: "/admin/admin-management",
                                },
                            ]
                            : []),

                        { name: "⚙️ Settings", path: "/admin/settings" },
                    ].map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`block rounded-lg p-3 transition ${
                                item.path === "/admin/dashboard"
                                    ? "bg-blue-600"
                                    : "hover:bg-slate-800"
                            }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="mt-10 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                    🚪 Logout
                </button>

            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10">

                {/* Header */}
                <header className="mb-10 flex flex-wrap items-center justify-between gap-4">

                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">
                            Dashboard
                        </h2>

                        <p className="mt-2 text-slate-500">
                            Nigerian Election Opinion Polling Platform
                        </p>
                    </div>

                    {/* Create Opinion Poll Button */}
                    <Link
                        href="/admin/polls"
                        className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                        + Create Opinion Poll
                    </Link>

                </header>

                {/* Statistics */}
                <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">

                    {stats.map((stat) => (
                        <div
                            key={stat.title}
                            className="rounded-xl bg-white p-6 shadow-sm"
                        >
                            <div className="mb-4 text-3xl">
                                {stat.icon}
                            </div>

                            <p className="text-slate-500">
                                {stat.title}
                            </p>

                            <h3 className="mt-2 text-3xl font-bold text-slate-800">
                                {loadingStats ? "Loading..." : stat.value}
                            </h3>
                        </div>
                    ))}

                </section>

                {/* Election Categories */}
                <section className="mt-10">

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-xl font-bold text-slate-800">
                            Election Categories
                        </h3>

                        <Link
                            href="/admin/elections"
                            className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                            View All Elections →
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

                        {electionCategories.map((category) => (
                            <Link
                                key={category.title}
                                href={`/admin/elections?category=${encodeURIComponent(
                                    category.category
                                )}`}
                                className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="mb-4 text-3xl">
                                    {category.icon}
                                </div>

                                <h4 className="font-bold text-slate-800">
                                    {category.title}
                                </h4>

                                <p className="mt-2 text-sm text-slate-500">
                                    {category.description}
                                </p>

                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                                    <span className="text-sm font-medium text-slate-500">
                                        Total Elections
                                    </span>

                                    <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-bold text-blue-700">
                                        {loadingCategories
                                            ? "..."
                                            : categoryCounts[category.category] || 0}
                                    </span>

                                </div>

                                <p className="mt-3 text-xs font-semibold text-blue-600">
                                    View Elections →
                                </p>

                            </Link>
                        ))}

                        {/* Political Parties */}
                        <Link
                            href="/admin/parties"
                            className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                        >
                            <div className="mb-4 text-3xl">
                                🚩
                            </div>

                            <h4 className="font-bold text-slate-800">
                                Political Parties
                            </h4>

                            <p className="mt-2 text-sm text-slate-500">
                                Political party management and registration.
                            </p>

                            <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold text-blue-600">
                                Manage Political Parties →
                            </p>
                        </Link>

                    </div>

                </section>

                {/* Recent Opinion Polls */}
                <section className="mt-10 rounded-xl bg-white p-6 shadow-sm">

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

                        <h3 className="text-xl font-bold text-slate-800">
                            Recent Opinion Polls
                        </h3>

                        <Link
                            href="/admin/polls"
                            className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                            View All →
                        </Link>

                    </div>

                    <div className="space-y-5">

                        {loadingPolls ? (
                            <p className="py-6 text-center text-slate-500">
                                Loading recent opinion polls...
                            </p>
                        ) : recentPolls.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-slate-500">
                                    No opinion polls have been created yet.
                                </p>

                                <Link
                                    href="/admin/polls"
                                    className="mt-3 inline-block font-semibold text-blue-600 hover:underline"
                                >
                                    Create your first opinion poll →
                                </Link>
                            </div>
                        ) : (
                            recentPolls.map((poll) => (
                                <div
                                    key={poll._id}
                                    className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 last:border-0 last:pb-0"
                                >

                                    <div>
                                        <h4 className="font-semibold text-slate-800">
                                            {poll.title}
                                        </h4>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {poll.election?.state ||
                                                poll.election?.category ||
                                                "Nigeria"}
                                            {" · "}
                                            {poll.participantCount.toLocaleString()} participants
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-full px-4 py-2 text-sm font-medium ${
                                            poll.status === "Active"
                                                ? "bg-green-100 text-green-700"
                                                : poll.status === "Upcoming"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {poll.status}
                                    </span>

                                </div>
                            ))
                        )}

                    </div>

                </section>

                <footer className="mt-10 text-center text-sm text-slate-400">
                    VoteHub © 2026 · Nigerian Election Opinion Polling Platform
                </footer>

            </main>

        </div>
    );
}