"use client";

import { useEffect, useState } from "react";

interface User {
_id: string;
name: string;
email: string;
state: string;
lga: string;
accountStatus: "active" | "suspended";
createdAt: string;
}

export default function AdminUsersPage() {
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
const [updating, setUpdating] = useState("");
const [error, setError] = useState("");
const [message, setMessage] = useState("");
const [selectedUser, setSelectedUser] = useState<User | null>(null);

// Fetch users
const fetchUsers = async (searchTerm = "") => {
    try {
        setLoading(true);
        setError("");

        const response = await fetch(
            `/api/admin/users?search=${encodeURIComponent(searchTerm)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to fetch users.");
        }

        setUsers(data.users || []);
    } catch (err) {
        setError(
            err instanceof Error ? err.message : "Something went wrong."
        );
    } finally {
        setLoading(false);
    }
};

// Search users
useEffect(() => {
    const timer = setTimeout(() => {
        fetchUsers(search);
    }, 300);

    return () => clearTimeout(timer);
}, [search]);

// Suspend or reactivate user
const updateUserStatus = async (
    userId: string,
    accountStatus: "active" | "suspended"
) => {
    try {
        setUpdating(userId);
        setError("");
        setMessage("");

        const response = await fetch("/api/admin/users", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                accountStatus,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to update account.");
        }

        setMessage(data.message || "Account updated successfully.");

        // Update selected user if their details are open
        if (selectedUser?._id === userId) {
            setSelectedUser({
                ...selectedUser,
                accountStatus,
            });
        }

        await fetchUsers(search);
    } catch (err) {
        setError(
            err instanceof Error ? err.message : "Something went wrong."
        );
    } finally {
        setUpdating("");
    }
};

// Confirm before changing status
const handleStatusChange = (
    user: User,
    isSuspended: boolean
) => {
    const action = isSuspended ? "reactivate" : "suspend";

    const confirmed = window.confirm(
        `Are you sure you want to ${action} ${user.name}'s account?`
    );

    if (confirmed) {
        updateUserStatus(
            user._id,
            isSuspended ? "active" : "suspended"
        );
    }
};

const activeUsers = users.filter(
    (user) => user.accountStatus !== "suspended"
).length;

const suspendedUsers = users.filter(
    (user) => user.accountStatus === "suspended"
).length;

return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                    User Management
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    Manage registered users and control their account access.
                </p>
            </div>

            {/* Statistics */}
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">Total Users</p>
                    <h2 className="mt-2 text-3xl font-bold text-gray-900">
                        {users.length}
                    </h2>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">Active Users</p>
                    <h2 className="mt-2 text-3xl font-bold text-green-600">
                        {activeUsers}
                    </h2>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">Suspended Users</p>
                    <h2 className="mt-2 text-3xl font-bold text-red-600">
                        {suspendedUsers}
                    </h2>
                </div>

            </div>

            {/* Messages */}
            {message && (
                <div className="mb-5 rounded-lg bg-green-100 p-4 text-sm text-green-700">
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-5 rounded-lg bg-red-100 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Users Section */}
            <div className="rounded-xl bg-white p-5 shadow-sm md:p-6">

                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Registered Users
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            View and manage user accounts.
                        </p>
                    </div>

                    <input
                        type="text"
                        placeholder="Search name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:w-72"
                    />

                </div>

                {/* Loading */}
                {loading ? (
                    <div className="py-12 text-center text-gray-500">
                        Loading users...
                    </div>
                ) : users.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        No users found.
                    </div>
                ) : (

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left">

                            <thead>
                                <tr className="border-b bg-gray-50 text-sm text-gray-500">
                                    <th className="px-4 py-4">User</th>
                                    <th className="px-4 py-4">Location</th>
                                    <th className="px-4 py-4">Date Joined</th>
                                    <th className="px-4 py-4">Status</th>
                                    <th className="px-4 py-4">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.map((user) => {
                                    const isSuspended =
                                        user.accountStatus === "suspended";

                                    return (
                                        <tr
                                            key={user._id}
                                            className="border-b last:border-0 hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-5">
                                                <p className="font-semibold text-gray-900">
                                                    {user.name}
                                                </p>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    {user.email}
                                                </p>
                                            </td>

                                            <td className="px-4 py-5 text-sm text-gray-600">
                                                {user.lga
                                                    ? `${user.lga}, ${user.state}`
                                                    : user.state}
                                            </td>

                                            <td className="px-4 py-5 text-sm text-gray-600">
                                                {new Date(
                                                    user.createdAt
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="px-4 py-5">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        isSuspended
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-green-100 text-green-700"
                                                    }`}
                                                >
                                                    {isSuspended
                                                        ? "Suspended"
                                                        : "Active"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-5">
                                                <div className="flex items-center gap-2">

                                                    {/* View Details */}
                                                    <button
                                                        onClick={() =>
                                                            setSelectedUser(user)
                                                        }
                                                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                                    >
                                                        View
                                                    </button>

                                                    {/* Suspend / Reactivate */}
                                                    <button
                                                        disabled={
                                                            updating === user._id
                                                        }
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                user,
                                                                isSuspended
                                                            )
                                                        }
                                                        className={`rounded-lg px-3 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                            isSuspended
                                                                ? "bg-green-600 hover:bg-green-700"
                                                                : "bg-red-600 hover:bg-red-700"
                                                        }`}
                                                    >
                                                        {updating === user._id
                                                            ? "Updating..."
                                                            : isSuspended
                                                            ? "Reactivate"
                                                            : "Suspend"}
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>

                        </table>
                    </div>
                )}

            </div>

        </div>

        {/* USER DETAILS MODAL */}
        {selectedUser && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={() => setSelectedUser(null)}
            >
                <div
                    className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >

                    {/* Modal Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                User Details
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Registered account information
                            </p>
                        </div>

                        <button
                            onClick={() => setSelectedUser(null)}
                            className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        >
                            ✕
                        </button>
                    </div>

                    {/* User Information */}
                    <div className="space-y-5">

                        <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="mt-1 font-semibold text-gray-900">
                                {selectedUser.name}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Email Address</p>
                            <p className="mt-1 font-semibold text-gray-900 break-all">
                                {selectedUser.email}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            <div>
                                <p className="text-sm text-gray-500">State</p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {selectedUser.state || "Not provided"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">LGA</p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {selectedUser.lga || "Not provided"}
                                </p>
                            </div>

                        </div>

                        <div>
                            <p className="text-sm text-gray-500">
                                Registration Date
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {new Date(
                                    selectedUser.createdAt
                                ).toLocaleString()}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Account Status</p>

                            <span
                                className={`mt-2 inline-block rounded-full px-4 py-2 text-sm font-semibold ${
                                    selectedUser.accountStatus === "suspended"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-green-100 text-green-700"
                                }`}
                            >
                                {selectedUser.accountStatus === "suspended"
                                    ? "Suspended"
                                    : "Active"}
                            </span>
                        </div>

                    </div>

                    {/* Modal Footer */}
                    <button
                        onClick={() => setSelectedUser(null)}
                        className="mt-8 w-full rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
                    >
                        Close
                    </button>

                </div>
            </div>
        )}

    </div>
);

}
