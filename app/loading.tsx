export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center">

                {/* Loading Spinner */}
                <div className="relative flex h-16 w-16 items-center justify-center">
                    <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>

                    <span className="text-xl font-extrabold text-blue-600">
                        V
                    </span>
                </div>

                {/* Loading Text */}
                <h2 className="mt-6 text-xl font-bold text-slate-800">
                    VoteHub
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                    Loading, please wait...
                </p>

            </div>
        </div>
    );
}