"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";

interface Election {
    _id: string;
    title: string;
    category: string;
    state: string;
    description: string;
    startDate: string;
    endDate: string;
    status: "Upcoming" | "Active" | "Closed";
}

export default function ElectionsPage() {
    const [elections, setElections] = useState<Election[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        category: "Presidential",
        state: "National",
        description: "",
        startDate: "",
        endDate: "",
        status: "Upcoming",
    });

    // Read category from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setSelectedCategory(params.get("category"));
    }, []);

    // Filter elections by selected category
    const filteredElections = selectedCategory
        ? elections.filter(
              (election) => election.category === selectedCategory
          )
        : elections;

    // Fetch elections from MongoDB
    const fetchElections = async () => {
        try {
            const response = await fetch("/api/admin/elections");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to fetch elections");
            }

            setElections(data.elections);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchElections();
    }, []);

    // Handle form input changes
    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Create a new election
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setSubmitting(true);

        try {
            const response = await fetch("/api/admin/elections", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to create election");
            }

            setSuccess("Election created successfully!");

            setFormData({
                title: "",
                category: "Presidential",
                state: "National",
                description: "",
                startDate: "",
                endDate: "",
                status: "Upcoming",
            });

            setShowForm(false);

            await fetchElections();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong"
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-10">

            {/* Header */}
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Link
                        href="/admin/dashboard"
                        className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                        ← Back to Dashboard
                    </Link>

                    <h1 className="mt-4 text-3xl font-bold text-black">
                        Election Management
                    </h1>

                    <p className="mt-2 text-black">
                        Create and manage Nigerian election opinion polls.
                    </p>
                </div>

                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setError("");
                        setSuccess("");
                    }}
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                    {showForm ? "Close Form" : "+ Create Election"}
                </button>
            </header>

            {/* Messages */}
            {error && (
                <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-700">
                    {success}
                </div>
            )}

            {/* Create Election Form */}
            {showForm && (
                <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-6 text-xl font-bold text-black">
                        Create New Election
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Election Title
                            </label>

                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. 2027 Presidential Election"
                                required
                                className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    Election Category
                                </label>

                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none focus:border-blue-500"
                                >
                                    <option value="Presidential">Presidential</option>
                                    <option value="Governorship">Governorship</option>
                                    <option value="Senatorial">Senatorial</option>
                                    <option value="House of Representatives">
                                        House of Representatives
                                    </option>
                                    <option value="State Assembly">State Assembly</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    State / Location
                                </label>

                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="e.g. Lagos State or National"
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Description
                            </label>

                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Enter election description..."
                                rows={4}
                                className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    Start Date
                                </label>

                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    End Date
                                </label>

                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Election Status
                            </label>

                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none focus:border-blue-500"
                            >
                                <option value="Upcoming">Upcoming</option>
                                <option value="Active">Active</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? "Creating..." : "Create Election"}
                        </button>
                    </form>
                </section>
            )}

            {/* Elections List */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-black">
                            {selectedCategory
                                ? `${selectedCategory} Elections`
                                : "All Elections"}
                        </h2>

                        {selectedCategory && (
                            <Link
                                href="/admin/elections"
                                className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline"
                            >
                                ← View All Elections
                            </Link>
                        )}
                    </div>

                    <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                        {filteredElections.length} Elections
                    </span>
                </div>

                {loading ? (
                    <p className="py-10 text-center text-black">
                        Loading elections...
                    </p>
                ) : filteredElections.length === 0 ? (
                    <div className="py-10 text-center">
                        <p className="text-4xl">🗳️</p>

                        <h3 className="mt-4 font-bold text-black">
                            No Elections Found
                        </h3>

                        <p className="mt-2 text-sm text-black">
                            {selectedCategory
                                ? `There are no ${selectedCategory} elections yet.`
                                : "Click Create Election to add your first election."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left">
                            <thead>
                                <tr className="border-b bg-slate-50 text-sm text-black">
                                    <th className="p-4">Election</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Location</th>
                                    <th className="p-4">Start Date</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredElections.map((election) => (
                                    <tr
                                        key={election._id}
                                        className="border-b border-slate-100 text-black hover:bg-slate-50"
                                    >
                                        <td className="p-4 font-semibold text-black">
                                            {election.title}
                                        </td>

                                        <td className="p-4 text-black">
                                            {election.category}
                                        </td>

                                        <td className="p-4 text-black">
                                            {election.state}
                                        </td>

                                        <td className="p-4 text-black">
                                            {new Date(
                                                election.startDate
                                            ).toLocaleDateString()}
                                        </td>

                                        <td className="p-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    election.status === "Active"
                                                        ? "bg-green-100 text-green-700"
                                                        : election.status === "Upcoming"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {election.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <footer className="mt-10 text-center text-sm text-black">
                VoteHub © 2026 · Nigerian Election Opinion Polling Platform
            </footer>
        </div>
    );
}