
"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            console.log("LOGIN RESPONSE:", data);
            console.log("USER ROLE:", data.user?.role);

            if (!response.ok || !data.success) {
                setError(data.message || "Login failed");
                setLoading(false);
                return;
            }

            if (!data.user?.role) {
                setError("User role was not returned by the server.");
                setLoading(false);
                return;
            }

            const destination =
                data.user.role === "admin"
                    ? "/admin/dashboard"
                    : "/dashboard";

            console.log("REDIRECTING TO:", destination);

            window.location.href = destination;

        } catch (error) {
            console.error("Login error:", error);
            setError("Unable to connect to the server");
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

                <h1 className="text-center text-3xl font-bold text-black">
                    Vote<span className="text-blue-600">Hub</span>
                </h1>

                <h2 className="mt-6 text-center text-2xl font-bold text-black">
                    Welcome Back
                </h2>

                <p className="mt-2 text-center text-sm text-black">
                    Login to your VoteHub account.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                    />

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>

                <p className="mt-6 text-center text-sm text-black">
                    Don't have an account?{" "}
                    <Link
                        href="/signup"
                        className="font-semibold text-blue-600"
                    >
                        Sign Up
                    </Link>
                </p>

            </div>
        </div>
    );
}
