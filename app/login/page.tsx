"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                    }) => void;
                    renderButton: (
                        element: HTMLElement,
                        options: {
                            theme: string;
                            size: string;
                            width: number;
                            text: string;
                            shape: string;
                        }
                    ) => void;
                };
            };
        };
    }
}

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

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
                data.user.role === "admin" ||
                data.user.role === "superadmin"
                    ? "/admin/dashboard"
                    : "/dashboard";

            window.location.href = destination;

        } catch (error) {
            console.error("Login error:", error);
            setError("Unable to connect to the server");
            setLoading(false);
        }
    }

    async function handleGoogleResponse(response: {
        credential: string;
    }) {
        setError("");
        setGoogleLoading(true);

        try {
            const result = await fetch("/api/auth/google", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    credential: response.credential,
                }),
            });

            const data = await result.json();

            if (!result.ok || !data.success) {
                setError(data.message || "Google sign-in failed");
                setGoogleLoading(false);
                return;
            }

            if (!data.user?.role) {
                setError("User role was not returned by the server.");
                setGoogleLoading(false);
                return;
            }

            const destination =
                data.user.role === "admin" ||
                data.user.role === "superadmin"
                    ? "/admin/dashboard"
                    : "/dashboard";

            window.location.href = destination;

        } catch (error) {
            console.error("Google sign-in error:", error);
            setError("Unable to connect to the server");
            setGoogleLoading(false);
        }
    }

    function initializeGoogleSignIn() {
        const google = window.google;
        const button = document.getElementById("google-signin-button");
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

        if (!google || !button || !clientId) {
            setError("Google Sign-In could not be initialized.");
            return;
        }

        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
        });

        button.innerHTML = "";

        google.accounts.id.renderButton(button, {
            theme: "outline",
            size: "large",
            width: 320,
            text: "continue_with",
            shape: "rectangular",
        });
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={initializeGoogleSignIn}
            />

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
                        disabled={loading || googleLoading}
                        className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>

                <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <span className="text-sm text-slate-500">OR</span>
                    <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                <div className="flex justify-center">
                    <div id="google-signin-button"></div>
                </div>

                {googleLoading && (
                    <p className="mt-3 text-center text-sm text-blue-600">
                        Signing in with Google...
                    </p>
                )}

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