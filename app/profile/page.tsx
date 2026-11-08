"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
id: string;
name: string;
email: string;
state: string;
lga: string;
role: string;
accountStatus: string;
createdAt: string;
}

export default function ProfilePage() {
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
    async function fetchProfile() {
        try {
            const response = await fetch("/api/auth/me");
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load profile.");
            }

            setUser(data.user);
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

    fetchProfile();
}, []);

if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
            <p className="text-lg font-semibold text-slate-600">
                Loading your profile...
            </p>
        </div>
    );
}

if (error || !user) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6">
            <p className="text-red-600">
                {error || "Profile not found."}
            </p>

            <Link
                href="/login"
                className="mt-4 rounded-lg bg-blue-600 px-6 py-3 text-white"
            >
                Go to Login
            </Link>
        </div>
    );
}

return (
    <div className="min-h-screen bg-slate-100">

        {/* Navbar */}
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
                        className="font-semibold text-blue-600"
                    >
                        Profile
                    </Link>

                    <button
                        onClick={async () => {
                            await fetch("/api/auth/logout", {
                                method: "POST",
                            });

                            window.location.href = "/login";
                        }}
                        className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>

        {/* Profile Content */}
        <main className="mx-auto max-w-5xl px-6 py-10">

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    My Profile
                </h1>

                <p className="mt-2 text-slate-500">
                    View your personal information and account details.
                </p>
            </div>

            {/* Profile Header */}
            <section className="mb-8 rounded-2xl bg-blue-700 p-8 text-white">

                <div className="flex flex-wrap items-center gap-5">

                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-blue-700">
                        {user.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold">
                            {user.name}
                        </h2>

                        <p className="mt-1 text-blue-100">
                            {user.email}
                        </p>

                        <span className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1 text-sm">
                            {user.role.toUpperCase()}
                        </span>
                    </div>

                </div>
            </section>

            {/* Personal Information */}
            <section className="rounded-2xl bg-white p-8 shadow-sm">

                <h2 className="mb-6 text-xl font-bold text-slate-900">
                    Personal Information
                </h2>

                <div className="grid gap-6 sm:grid-cols-2">

                    <div>
                        <p className="text-sm text-slate-500">
                            Full Name
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                            {user.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">
                            Email Address
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                            {user.email}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">
                            State
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                            {user.state || "Not provided"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">
                            Local Government Area
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                            {user.lga || "Not provided"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">
                            Account Role
                        </p>

                        <p className="mt-2 font-semibold capitalize text-slate-900">
                            {user.role}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">
                            Account Status
                        </p>

                        <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold capitalize text-green-700">
                            {user.accountStatus}
                        </span>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">
                            Registration Date
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                            {new Date(user.createdAt).toLocaleDateString(
                                "en-NG",
                                {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                }
                            )}
                        </p>
                    </div>

                </div>
            </section>

            <div className="mt-8">
                <Link
                    href="/dashboard"
                    className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                >
                    Back to Dashboard
                </Link>
            </div>

        </main>
    </div>
);

}
