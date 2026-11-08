"use client";

import { useEffect, useState } from "react";

interface Activity {
    _id: string;
    action: string;
    description: string;
    targetType: string;
    createdAt: string;
    admin: {
        name: string;
        email: string;
    } | null;
}

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/admin/activity-logs");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to fetch activity logs.");
            }

            setLogs(data.logs || []);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString("en-NG", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case "USER_SUSPENDED":
                return "bg-red-100 text-red-700";

            case "USER_REACTIVATED":
                return "bg-green-100 text-green-700";

            default:
                return "bg-blue-100 text-blue-700";
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
    <div>
        <h1 className="text-3xl font-bold text-slate-800">
            Activity Logs
        </h1>

        <p className="mt-2 text-slate-500">
            Monitor important activities performed by administrators.
        </p>

        <a
            href="/admin/dashboard"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
            ← Back to Dashboard
        </a>
    </div>

    <button
        onClick={fetchLogs}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
    >
        {loading ? "Loading..." : "Refresh Logs"}
    </button>
</div>

                {/* Statistics */}
                <div className="mb-6 grid gap-4 sm:grid-cols-3">

                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Total Activities
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-slate-800">
                            {logs.length}
                        </h2>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Users Suspended
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-red-600">
                            {logs.filter(
                                (log) => log.action === "USER_SUSPENDED"
                            ).length}
                        </h2>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Users Reactivated
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-green-600">
                            {logs.filter(
                                (log) => log.action === "USER_REACTIVATED"
                            ).length}
                        </h2>
                    </div>

                </div>

                {/* Activity Table */}
                <div className="overflow-hidden rounded-xl bg-white shadow-sm">

                    <div className="border-b p-5">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Recent Activities
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-slate-500">
                            Loading activity logs...
                        </div>
                    ) : error ? (
                        <div className="p-10 text-center text-red-600">
                            {error}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            No activities recorded yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">

                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="p-4">Action</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4">Administrator</th>
                                        <th className="p-4">Date</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {logs.map((log) => (
                                        <tr
                                            key={log._id}
                                            className="border-t hover:bg-slate-50"
                                        >
                                            <td className="p-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getActionColor(log.action)}`}
                                                >
                                                    {log.action.replaceAll("_", " ")}
                                                </span>
                                            </td>

                                            <td className="max-w-sm p-4 text-slate-700">
                                                {log.description}
                                            </td>

                                            <td className="p-4 text-slate-600">
                                                {log.admin?.name || "Unknown Admin"}
                                            </td>

                                            <td className="whitespace-nowrap p-4 text-slate-500">
                                                {formatDate(log.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}