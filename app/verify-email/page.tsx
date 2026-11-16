"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function verifyEmail() {
            try {
                const params = new URLSearchParams(window.location.search);
                const token = params.get("token");

                if (!token) {
                    setMessage("Verification token is missing.");
                    setLoading(false);
                    return;
                }

                const response = await fetch(
                    `/api/auth/verify-email?token=${encodeURIComponent(token)}`
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Email verification failed."
                    );
                }

                setSuccess(true);
                setMessage(data.message);

            } catch (error) {
                setSuccess(false);

                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Something went wrong."
                );
            } finally {
                setLoading(false);
            }
        }

        verifyEmail();
    }, []);

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">

            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">

                {loading ? (
                    <>
                        <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                        <h1 className="text-2xl font-bold text-slate-800">
                            Verifying Your Email
                        </h1>

                        <p className="mt-3 text-slate-500">
                            Please wait while we verify your VoteHub account.
                        </p>
                    </>
                ) : (
                    <>
                        <div
                            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
                                success
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                            }`}
                        >
                            {success ? "✓" : "✕"}
                        </div>

                        <h1 className="text-2xl font-bold text-slate-800">
                            {success
                                ? "Email Verified!"
                                : "Verification Failed"}
                        </h1>

                        <p className="mt-3 text-slate-600">
                            {message}
                        </p>

                        {success ? (
                            <Link
                                href="/login"
                                className="mt-7 block w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                            >
                                Continue to Login
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="mt-7 block w-full rounded-lg bg-slate-800 px-5 py-3 font-semibold text-white transition hover:bg-slate-900"
                            >
                                Back to Login
                            </Link>
                        )}
                    </>
                )}

            </div>

        </main>
    );
}