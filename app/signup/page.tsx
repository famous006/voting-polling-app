"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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

export default function SignupPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        state: "",
        lga: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const googleInitialized = useRef(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.message || "Registration failed");
                return;
            }

            router.push("/dashboard");
            router.refresh();

        } catch {
            setError("Unable to connect to the server");
        } finally {
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
                setError(data.message || "Google registration failed");
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
            console.error("Google signup error:", error);
            setError("Unable to connect to the server");
            setGoogleLoading(false);
        }
    }

    function initializeGoogleSignIn(): boolean {
        const google = window.google;
        const button = document.getElementById("google-signup-button");
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

        if (!google || !button || !clientId) {
            return false;
        }

        if (googleInitialized.current) {
            return true;
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
            text: "signup_with",
            shape: "rectangular",
        });

        googleInitialized.current = true;

        return true;
    }

    useEffect(() => {
        initializeGoogleSignIn();
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">

            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onReady={() => {
                    initializeGoogleSignIn();
                }}
            />

            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

                <h1 className="text-center text-3xl font-bold text-black">
                    Vote<span className="text-blue-600">Hub</span>
                </h1>

                <h2 className="mt-6 text-center text-2xl font-bold text-black">
                    Create an Account
                </h2>

                <p className="mt-2 text-center text-sm text-black">
                    Join VoteHub and participate in opinion polls.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">

                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password (minimum 8 characters)"
                        value={form.password}
                        onChange={handleChange}
                        minLength={8}
                        required
                        className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                    />

                    <input
                        type="text"
                        name="state"
                        placeholder="State (e.g. Lagos)"
                        value={form.state}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                    />

                    <input
                        type="text"
                        name="lga"
                        placeholder="Local Government Area (Optional)"
                        value={form.lga}
                        onChange={handleChange}
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
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>

                </form>

                <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <span className="text-sm text-slate-500">OR</span>
                    <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                <div className="flex justify-center">
                    <div id="google-signup-button"></div>
                </div>

                {googleLoading && (
                    <p className="mt-3 text-center text-sm text-blue-600">
                        Creating your account with Google...
                    </p>
                )}

                <p className="mt-6 text-center text-sm text-black">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-blue-600"
                    >
                        Login
                    </Link>
                </p>

            </div>
        </div>
    );
}