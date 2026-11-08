"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

interface Election {
    _id: string;
    title: string;
    category: string;
    state: string;
}

interface Candidate {
    _id: string;
    name: string;
    party: string;
    partyLogo: string;
    profileImage: string;
    state: string;
    biography: string;
    election: Election | null;
}

const initialFormData = {
    name: "",
    party: "",
    partyLogo: "",
    profileImage: "",
    state: "",
    election: "",
    biography: "",
};

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [elections, setElections] = useState<Election[]>([]);

    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingCandidate, setEditingCandidate] =
        useState<string | null>(null);

    const [formData, setFormData] = useState(initialFormData);

    // Fetch candidates and elections
    const fetchData = async () => {
        try {
            const [candidateResponse, electionResponse] = await Promise.all([
                fetch("/api/admin/candidates"),
                fetch("/api/admin/elections"),
            ]);

            const candidateData = await candidateResponse.json();
            const electionData = await electionResponse.json();

            if (!candidateResponse.ok) {
                throw new Error(
                    candidateData.message || "Unable to fetch candidates"
                );
            }

            if (!electionResponse.ok) {
                throw new Error(
                    electionData.message || "Unable to fetch elections"
                );
            }

            setCandidates(candidateData.candidates || []);
            setElections(electionData.elections || []);
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
        fetchData();
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
        setEditingCandidate(null);
        setShowForm(false);
    };

    // Add or update candidate
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setSubmitting(true);

        try {
            const isEditing = Boolean(editingCandidate);

            const url = "/api/admin/candidates";

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    isEditing
                        ? {
                            ...formData,
                            _id: editingCandidate,
                        }
                        : formData
                ),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    (isEditing
                        ? "Unable to update candidate"
                        : "Unable to create candidate")
                );
            }

            setSuccess(
                isEditing
                    ? "Candidate updated successfully!"
                    : "Candidate created successfully!"
            );

            resetForm();

            await fetchData();
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

    // Edit candidate
    const handleEdit = (candidate: Candidate) => {
        setError("");
        setSuccess("");

        setEditingCandidate(candidate._id);

        setFormData({
            name: candidate.name,
            party: candidate.party,
            partyLogo: candidate.partyLogo || "",
            profileImage: candidate.profileImage || "",
            state: candidate.state || "",
            election: candidate.election?._id || "",
            biography: candidate.biography || "",
        });

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // Delete candidate
    const handleDelete = async (candidate: Candidate) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${candidate.name}?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `/api/admin/candidates?id=${candidate._id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to delete candidate"
                );
            }

            setSuccess("Candidate deleted successfully!");

            await fetchData();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong"
            );
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
                        Candidate Management
                    </h1>

                    <p className="mt-2 text-black">
                        Add and manage political candidates for Nigerian elections.
                    </p>
                </div>

                <button
                    onClick={() => {
                        if (showForm) {
                            resetForm();
                        } else {
                            setFormData(initialFormData);
                            setEditingCandidate(null);
                            setShowForm(true);
                        }

                        setError("");
                        setSuccess("");
                    }}
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                    {showForm ? "Close Form" : "+ Add Candidate"}
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

            {/* Candidate Form */}
            {showForm && (
                <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">

                    <h2 className="mb-6 text-xl font-bold text-black">
                        {editingCandidate
                            ? "Edit Candidate"
                            : "Add New Candidate"}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        <div className="grid gap-5 md:grid-cols-2">

                            {/* Candidate Name */}
                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    Candidate Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter candidate's full name"
                                    required
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Political Party */}
                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    Political Party
                                </label>

                                <input
                                    type="text"
                                    name="party"
                                    value={formData.party}
                                    onChange={handleChange}
                                    placeholder="e.g. APC, PDP, LP"
                                    required
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                                />
                            </div>

                        </div>

                        {/* Election */}
                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Select Election
                            </label>

                            <select
                                name="election"
                                value={formData.election}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none focus:border-blue-500"
                            >
                                <option value="">Choose an election</option>

                                {elections.map((election) => (
                                    <option
                                        key={election._id}
                                        value={election._id}
                                    >
                                        {election.title} ({election.category})
                                    </option>
                                ))}
                            </select>

                            {elections.length === 0 && (
                                <p className="mt-2 text-sm text-red-600">
                                    No elections available. Create an election first.
                                </p>
                            )}
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">

                            {/* Candidate State */}
                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    Candidate State
                                </label>

                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="e.g. Lagos"
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Party Logo */}
                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    Party Logo URL
                                </label>

                                <input
                                    type="url"
                                    name="partyLogo"
                                    value={formData.partyLogo}
                                    onChange={handleChange}
                                    placeholder="Paste party logo image URL"
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                                />
                            </div>

                        </div>

                        {/* Profile Image */}
                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Candidate Profile Image URL
                            </label>

                            <input
                                type="url"
                                name="profileImage"
                                value={formData.profileImage}
                                onChange={handleChange}
                                placeholder="Paste candidate image URL"
                                className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Biography */}
                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Biography
                            </label>

                            <textarea
                                name="biography"
                                value={formData.biography}
                                onChange={handleChange}
                                placeholder="Write a short biography about the candidate..."
                                rows={4}
                                className="w-full rounded-lg border border-slate-300 p-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Form Buttons */}
                        <div className="flex flex-wrap gap-3">

                            <button
                                type="submit"
                                disabled={submitting || elections.length === 0}
                                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting
                                    ? "Please wait..."
                                    : editingCandidate
                                        ? "Update Candidate"
                                        : "Add Candidate"}
                            </button>

                            {editingCandidate && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={submitting}
                                    className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-black transition hover:bg-slate-100"
                                >
                                    Cancel Editing
                                </button>
                            )}

                        </div>

                    </form>

                </section>
            )}

            {/* Candidates List */}
            <section className="rounded-xl bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-black">
                        All Candidates
                    </h2>

                    <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                        {candidates.length} Candidates
                    </span>
                </div>

                {loading ? (
                    <p className="py-10 text-center text-black">
                        Loading candidates...
                    </p>
                ) : candidates.length === 0 ? (
                    <div className="py-10 text-center">

                        <p className="text-4xl">👤</p>

                        <h3 className="mt-4 font-bold text-black">
                            No Candidates Yet
                        </h3>

                        <p className="mt-2 text-sm text-black">
                            Click Add Candidate to register your first candidate.
                        </p>

                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1050px] text-left">

                            <thead>
                                <tr className="border-b bg-slate-50 text-sm text-black">
                                    <th className="p-4">Candidate</th>
                                    <th className="p-4">Political Party</th>
                                    <th className="p-4">State</th>
                                    <th className="p-4">Election</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {candidates.map((candidate) => (
                                    <tr
                                        key={candidate._id}
                                        className="border-b border-slate-100 text-black hover:bg-slate-50"
                                    >

                                        {/* Candidate */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">

                                                {candidate.profileImage ? (
                                                    <img
                                                        src={candidate.profileImage}
                                                        alt={candidate.name}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                                        {candidate.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}

                                                <span className="font-semibold">
                                                    {candidate.name}
                                                </span>

                                            </div>
                                        </td>

                                        {/* Political Party */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">

                                                {candidate.partyLogo && (
                                                    <img
                                                        src={candidate.partyLogo}
                                                        alt={candidate.party}
                                                        className="h-7 w-7 object-contain"
                                                    />
                                                )}

                                                {candidate.party}

                                            </div>
                                        </td>

                                        {/* State */}
                                        <td className="p-4">
                                            {candidate.state}
                                        </td>

                                        {/* Election */}
                                        <td className="p-4">
                                            {candidate.election?.title || "Not available"}
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">

                                                <button
                                                    onClick={() => handleEdit(candidate)}
                                                    className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(candidate)}
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