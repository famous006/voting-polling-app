"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Admin {
    _id: string;
    name: string;
    email: string;
    state?: string;
    lga?: string;
    role: "admin" | "superadmin";
    accountStatus: "active" | "suspended";
    createdAt: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    state?: string;
    lga?: string;
    accountStatus: "active" | "suspended";
    createdAt: string;
}

export default function AdminManagementPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"admins" | "users">("admins");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Safely read API responses
    const readResponse = async (response: Response, endpoint: string) => {
        const text = await response.text();

        try {
            return JSON.parse(text);
        } catch {
            console.error(`${endpoint} returned non-JSON data:`, text);

            throw new Error(
                `${endpoint} returned an invalid response. HTTP Status: ${response.status}. Check the API route and browser console.`
            );
        }
    };

    // Fetch administrators and ordinary users
    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [adminsResponse, usersResponse] = await Promise.all([
                fetch("/api/superadmin/admins"),
                fetch("/api/admin/users"),
            ]);

            const adminsData = await readResponse(
                adminsResponse,
                "Administrators API"
            );

            const usersData = await readResponse(
                usersResponse,
                "Users API"
            );

            if (!adminsResponse.ok || !adminsData.success) {
                throw new Error(
                    adminsData.message || "Unable to fetch administrators."
                );
            }

            if (!usersResponse.ok || !usersData.success) {
                throw new Error(
                    usersData.message || "Unable to fetch registered users."
                );
            }

            setAdmins(adminsData.admins || []);
            setUsers(usersData.users || []);

        } catch (err) {
            console.error("Admin management error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while loading data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Promote ordinary user to Admin
    const handlePromote = async (user: User) => {
        const confirmed = window.confirm(
            `Are you sure you want to promote ${user.name} to Admin?`
        );

        if (!confirmed) return;

        try {
            setActionLoading(user._id);
            setMessage("");
            setError("");

            const response = await fetch("/api/superadmin/admins", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user._id,
                    action: "promote",
                }),
            });

            const data = await readResponse(
                response,
                "Promote Admin API"
            );

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Promotion failed.");
            }

            setMessage(
                `${user.name} has been promoted successfully. They must log in again to access Admin privileges.`
            );

            await fetchData();

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to promote user."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // Demote Admin back to ordinary User
    const handleDemote = async (admin: Admin) => {
        if (admin.role === "superadmin") {
            setError("The Super Admin account cannot be demoted here.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to remove ${admin.name}'s Admin privileges?`
        );

        if (!confirmed) return;

        try {
            setActionLoading(admin._id);
            setMessage("");
            setError("");

            const response = await fetch("/api/superadmin/admins", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: admin._id,
                    action: "demote",
                }),
            });

            const data = await readResponse(
                response,
                "Demote Admin API"
            );

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Demotion failed.");
            }

            setMessage(
                `${admin.name} has been demoted successfully. They must log in again to access their updated account.`
            );

            await fetchData();

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to demote administrator."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // Search administrators
    const filteredAdmins = admins.filter((admin) =>
        `${admin.name} ${admin.email} ${admin.role}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    // Search ordinary users
    const filteredUsers = users.filter((user) =>
        `${user.name} ${user.email} ${user.state || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-10">

            {/* Header */}
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4">

                <div>
                    <Link
                        href="/admin/dashboard"
                        className="mb-3 inline-block text-sm font-semibold text-blue-600 hover:underline"
                    >
                        ← Back to Dashboard
                    </Link>

                    <h1 className="text-3xl font-bold text-slate-800">
                        Admin Management
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Manage administrators and control platform access.
                    </p>
                </div>

                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Refreshing..." : "↻ Refresh"}
                </button>

            </header>

            {/* Statistics */}
            <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Total Administrators
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-blue-600">
                        {loading ? "..." : admins.length}
                    </h2>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Super Administrators
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-purple-600">
                        {loading
                            ? "..."
                            : admins.filter(
                                (admin) => admin.role === "superadmin"
                            ).length}
                    </h2>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Ordinary Registered Users
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-green-600">
                        {loading ? "..." : users.length}
                    </h2>
                </div>

            </section>

            {/* Success Message */}
            {message && (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {message}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Management Section */}
            <section className="rounded-xl bg-white p-6 shadow-sm">

                {/* Tabs and Search */}
                <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

                    <div className="flex flex-wrap gap-3">

                        <button
                            onClick={() => {
                                setActiveTab("admins");
                                setSearch("");
                            }}
                            className={`rounded-lg px-5 py-3 font-semibold transition ${
                                activeTab === "admins"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Administrators ({admins.length})
                        </button>

                        <button
                            onClick={() => {
                                setActiveTab("users");
                                setSearch("");
                            }}
                            className={`rounded-lg px-5 py-3 font-semibold transition ${
                                activeTab === "users"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Registered Users ({users.length})
                        </button>

                    </div>

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-black outline-none placeholder:text-slate-400 focus:border-blue-500 lg:w-80"
                    />

                </div>

                {/* Account Table */}
                {loading ? (
                    <div className="py-16 text-center text-slate-500">
                        Loading account information...
                    </div>
                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[750px] text-left">

                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-slate-600">
                                        Name
                                    </th>
                                    <th className="p-4 text-sm font-semibold text-slate-600">
                                        Email
                                    </th>
                                    <th className="p-4 text-sm font-semibold text-slate-600">
                                        Role
                                    </th>
                                    <th className="p-4 text-sm font-semibold text-slate-600">
                                        Status
                                    </th>
                                    <th className="p-4 text-sm font-semibold text-slate-600">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {/* Administrators */}
                                {activeTab === "admins" && (
                                    <>
                                        {filteredAdmins.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-10 text-center text-slate-500">
                                                    No administrators found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAdmins.map((admin) => (
                                                <tr
                                                    key={admin._id}
                                                    className="border-b border-slate-100 transition hover:bg-slate-50"
                                                >
                                                    <td className="p-4 font-semibold text-slate-800">
                                                        {admin.name}
                                                    </td>

                                                    <td className="p-4 text-sm text-slate-600">
                                                        {admin.email}
                                                    </td>

                                                    <td className="p-4">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                                admin.role === "superadmin"
                                                                    ? "bg-purple-100 text-purple-700"
                                                                    : "bg-blue-100 text-blue-700"
                                                            }`}
                                                        >
                                                            {admin.role === "superadmin"
                                                                ? "Super Admin"
                                                                : "Admin"}
                                                        </span>
                                                    </td>

                                                    <td className="p-4">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                                admin.accountStatus === "active"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-red-100 text-red-700"
                                                            }`}
                                                        >
                                                            {admin.accountStatus}
                                                        </span>
                                                    </td>

                                                    <td className="p-4">
                                                        {admin.role === "superadmin" ? (
                                                            <span className="text-sm font-semibold text-purple-600">
                                                                Protected Account
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDemote(admin)}
                                                                disabled={actionLoading === admin._id}
                                                                className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                                                            >
                                                                {actionLoading === admin._id
                                                                    ? "Processing..."
                                                                    : "Remove Admin"}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </>
                                )}

                                {/* Ordinary Users */}
                                {activeTab === "users" && (
                                    <>
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-10 text-center text-slate-500">
                                                    No registered users found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <tr
                                                    key={user._id}
                                                    className="border-b border-slate-100 transition hover:bg-slate-50"
                                                >
                                                    <td className="p-4 font-semibold text-slate-800">
                                                        {user.name}
                                                    </td>

                                                    <td className="p-4 text-sm text-slate-600">
                                                        {user.email}
                                                    </td>

                                                    <td className="p-4">
                                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                            User
                                                        </span>
                                                    </td>

                                                    <td className="p-4">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                                user.accountStatus === "active"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-red-100 text-red-700"
                                                            }`}
                                                        >
                                                            {user.accountStatus}
                                                        </span>
                                                    </td>

                                                    <td className="p-4">
                                                        <button
                                                            onClick={() => handlePromote(user)}
                                                            disabled={
                                                                actionLoading === user._id ||
                                                                user.accountStatus === "suspended"
                                                            }
                                                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {actionLoading === user._id
                                                                ? "Processing..."
                                                                : "Promote to Admin"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </>
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </section>

            <footer className="mt-8 text-center text-sm text-slate-400">
                VoteHub © 2026 · Super Admin Management
            </footer>

        </div>
    );
}
