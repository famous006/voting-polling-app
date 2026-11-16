"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

interface PoliticalParty {
    _id: string;
    name: string;
    abbreviation: string;
    logo: string;
    description: string;
    website: string;
    status: "active" | "inactive";
    createdAt: string;
}

const initialFormData = {
    name: "",
    abbreviation: "",
    logo: "",
    description: "",
    website: "",
    status: "active",
};

export default function PoliticalPartiesPage() {
    const [parties, setParties] = useState<PoliticalParty[]>([]);

    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");

    const [editingParty, setEditingParty] = useState<string | null>(null);

    const [formData, setFormData] = useState(initialFormData);

    // Fetch all political parties
    const fetchParties = async () => {
        try {
            const response = await fetch("/api/admin/parties");

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to fetch political parties"
                );
            }

            setParties(data.parties || []);
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
        fetchParties();
    }, []);

    // Handle form changes
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Reset form
    const resetForm = () => {
        setFormData(initialFormData);
        setEditingParty(null);
        setShowForm(false);
    };

    // Create or update political party
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setSubmitting(true);

        try {
            const isEditing = Boolean(editingParty);

            const response = await fetch("/api/admin/parties", {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    isEditing
                        ? {
                            ...formData,
                            _id: editingParty,
                        }
                        : formData
                ),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    (isEditing
                        ? "Unable to update political party"
                        : "Unable to create political party")
                );
            }

            setSuccess(
                isEditing
                    ? "Political party updated successfully!"
                    : "Political party added successfully!"
            );

            resetForm();

            await fetchParties();
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

    // Edit political party
    const handleEdit = (party: PoliticalParty) => {
        setError("");
        setSuccess("");

        setEditingParty(party._id);

        setFormData({
            name: party.name,
            abbreviation: party.abbreviation,
            logo: party.logo || "",
            description: party.description || "",
            website: party.website || "",
            status: party.status,
        });

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // Delete political party
    const handleDelete = async (party: PoliticalParty) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${party.name}?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `/api/admin/parties?id=${party._id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to delete political party"
                );
            }

            setSuccess("Political party deleted successfully!");

            await fetchParties();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong"
            );
        }
    };

    // Search parties
    const filteredParties = parties.filter((party) => {
        const searchValue = search.toLowerCase();

        return (
            party.name.toLowerCase().includes(searchValue) ||
            party.abbreviation.toLowerCase().includes(searchValue)
        );
    });

    const activeParties = parties.filter(
        (party) => party.status === "active"
    ).length;

    const inactiveParties = parties.filter(
        (party) => party.status === "inactive"
    ).length;

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
                        Political Parties
                    </h1>

                    <p className="mt-2 text-black">
                        Register and manage political parties participating
                        in Nigerian elections.
                    </p>
                </div>

                <button
                    onClick={() => {
                        if (showForm) {
                            resetForm();
                        } else {
                            setFormData(initialFormData);
                            setEditingParty(null);
                            setShowForm(true);
                        }

                        setError("");
                        setSuccess("");
                    }}
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                    {showForm ? "Close Form" : "+ Add Political Party"}
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

            {/* Statistics */}
            <section className="mb-8 grid gap-5 sm:grid-cols-3">

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Total Political Parties
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-black">
                        {parties.length}
                    </h2>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Active Parties
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-green-600">
                        {activeParties}
                    </h2>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Inactive Parties
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-red-600">
                        {inactiveParties}
                    </h2>
                </div>

            </section>

            {/* Political Party Form */}
            {showForm && (
                <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">

                    <h2 className="mb-6 text-xl font-bold text-black">
                        {editingParty
                            ? "Edit Political Party"
                            : "Register New Political Party"}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        <div className="grid gap-5 md:grid-cols-2">

                            {/* Party Name */}
                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    Full Party Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. All Progressives Congress"
                                    required
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Abbreviation */}
                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    Party Abbreviation
                                </label>

                                <input
                                    type="text"
                                    name="abbreviation"
                                    value={formData.abbreviation}
                                    onChange={handleChange}
                                    placeholder="e.g. APC"
                                    required
                                    maxLength={15}
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black uppercase outline-none placeholder:text-slate-500 focus:border-blue-500"
                                />
                            </div>

                        </div>

                        {/* Logo URL */}
                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Party Logo URL
                            </label>

                            <input
                                type="url"
                                name="logo"
                                value={formData.logo}
                                onChange={handleChange}
                                placeholder="Paste political party logo image URL"
                                className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                            />

                            {formData.logo && (
                                <div className="mt-3 flex items-center gap-3">
                                    <img
                                        src={formData.logo}
                                        alt="Party logo preview"
                                        className="h-14 w-14 rounded-lg border border-slate-200 object-contain p-1"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />

                                    <span className="text-sm text-slate-500">
                                        Logo preview
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Website */}
                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Official Website
                            </label>

                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://example.com"
                                className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Party Description
                            </label>

                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Write a short description about this political party..."
                                rows={4}
                                className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Party Status
                            </label>

                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none focus:border-blue-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-wrap gap-3">

                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting
                                    ? "Please wait..."
                                    : editingParty
                                        ? "Update Party"
                                        : "Register Party"}
                            </button>

                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={submitting}
                                className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-black transition hover:bg-slate-100"
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </section>
            )}

            {/* Parties List */}
            <section className="rounded-xl bg-white p-6 shadow-sm">

                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

                    <div>
                        <h2 className="text-xl font-bold text-black">
                            All Political Parties
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage registered political parties.
                        </p>
                    </div>

                    <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                        {parties.length} Parties
                    </span>

                </div>

                {/* Search */}
                <div className="mb-6">

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by party name or abbreviation..."
                        className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500 md:max-w-md"
                    />

                </div>

                {loading ? (
                    <p className="py-10 text-center text-black">
                        Loading political parties...
                    </p>
                ) : filteredParties.length === 0 ? (
                    <div className="py-10 text-center">

                        <p className="text-4xl">🏛️</p>

                        <h3 className="mt-4 font-bold text-black">
                            {search
                                ? "No Matching Parties"
                                : "No Political Parties Yet"}
                        </h3>

                        <p className="mt-2 text-sm text-slate-600">
                            {search
                                ? "Try searching with another name or abbreviation."
                                : "Click Add Political Party to register your first party."}
                        </p>

                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[950px] text-left">

                            <thead>
                                <tr className="border-b bg-slate-50 text-sm text-black">
                                    <th className="p-4">Political Party</th>
                                    <th className="p-4">Abbreviation</th>
                                    <th className="p-4">Website</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Date Registered</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredParties.map((party) => (
                                    <tr
                                        key={party._id}
                                        className="border-b border-slate-100 text-black hover:bg-slate-50"
                                    >

                                        {/* Party */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">

                                                {party.logo ? (
                                                    <img
                                                        src={party.logo}
                                                        alt={party.name}
                                                        className="h-10 w-10 rounded-lg border border-slate-200 object-contain p-1"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                                                        {party.abbreviation.charAt(0)}
                                                    </div>
                                                )}

                                                <span className="font-semibold">
                                                    {party.name}
                                                </span>

                                            </div>
                                        </td>

                                        {/* Abbreviation */}
                                        <td className="p-4">
                                            <span className="rounded-md bg-slate-100 px-3 py-1 font-bold">
                                                {party.abbreviation}
                                            </span>
                                        </td>

                                        {/* Website */}
                                        <td className="p-4">
                                            {party.website ? (
                                                <a
                                                    href={party.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Visit Website
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">
                                                    Not provided
                                                </span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="p-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    party.status === "active"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {party.status}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="p-4">
                                            {party.createdAt
                                                ? new Date(
                                                    party.createdAt
                                                ).toLocaleDateString()
                                                : "Not available"}
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">

                                                <button
                                                    onClick={() => handleEdit(party)}
                                                    className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(party)}
                                                    className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                                                >
                                                    Delete
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>

                    </div>
                )}

            </section>

            {/* Footer */}
            <footer className="mt-10 text-center text-sm text-black">
                VoteHub © 2026 · Nigerian Election Opinion Polling Platform
            </footer>

        </div>
    );
}