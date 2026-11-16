    import Link from "next/link";

    export default function NotFound() {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
                <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-lg">

                    <h1 className="text-8xl font-extrabold text-blue-600">
                        404
                    </h1>

                    <h2 className="mt-4 text-2xl font-bold text-slate-900">
                        Page Not Found
                    </h2>

                    <p className="mt-3 text-slate-600">
                        Sorry, the page you're looking for doesn't exist,
                        has been moved, or is temporarily unavailable.
                    </p>

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

                        <Link
                            href="/"
                            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                        >
                            Back to Home
                        </Link>

                        <Link
                            href="/dashboard"
                            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            Go to Dashboard
                        </Link>

                    </div>

                    <p className="mt-8 text-sm font-semibold text-slate-500">
                        Vote<span className="text-blue-600">Hub</span>
                    </p>

                </div>
            </div>
        );
    }