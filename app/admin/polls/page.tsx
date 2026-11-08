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
}

interface Poll {
    _id: string;
    title: string;
    question: string;
    election: Election | null;
    candidates: Candidate[];
    startDate: string;
    endDate: string;
    status: "Upcoming" | "Active" | "Closed";
}

const initialForm = {
    title: "",
    question: "",
    election: "",
    candidates: [] as string[],
    startDate: "",
    endDate: "",
    status: "Upcoming",
};

export default function PollManagementPage() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [elections, setElections] = useState<Election[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);

    const [formData, setFormData] = useState(initialForm);
    const [editingPoll, setEditingPoll] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch polls, elections and candidates
    const fetchData = async () => {
        try {
            const [pollRes, electionRes, candidateRes] = await Promise.all([
                fetch("/api/admin/polls"),
                fetch("/api/admin/elections"),
                fetch("/api/admin/candidates"),
            ]);

            const [pollData, electionData, candidateData] = await Promise.all([
                pollRes.json(),
                electionRes.json(),
                candidateRes.json(),
            ]);

            if (!pollRes.ok) {
                throw new Error(pollData.message || "Unable to fetch polls");
            }

            if (!electionRes.ok) {
                throw new Error(electionData.message || "Unable to fetch elections");
            }

            if (!candidateRes.ok) {
                throw new Error(candidateData.message || "Unable to fetch candidates");
            }

            setPolls(pollData.polls || []);
            setElections(electionData.elections || []);
            setCandidates(candidateData.candidates || []);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Candidates belonging to the selected election
    const filteredCandidates = candidates.filter(
        (candidate) => {
            const candidateElection =
                typeof candidate === "object" ? candidate : null;

            return (
                candidateElection &&
                elections.some(
                    (election) =>
                        election._id === formData.election &&
                        candidateElection._id
                ) &&
                candidateElection
            );
        }
    );

    // Get candidates for the selected election
    const selectedElectionCandidates = candidates.filter(
        (candidate: Candidate & { election?: Election | string }) => {
            const electionId =
                typeof candidate.election === "string"
                    ? candidate.election
                    : candidate.election?._id;

            return electionId === formData.election;
        }
    );

    // Handle normal form fields
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;

        if (name === "election") {
            setFormData({
                ...formData,
                election: value,
                candidates: [],
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    // Handle candidate selection
    const handleCandidateSelection = (candidateId: string) => {
        setFormData((previous) => ({
            ...previous,
            candidates: previous.candidates.includes(candidateId)
                ? previous.candidates.filter((id) => id !== candidateId)
                : [...previous.candidates, candidateId],
        }));
    };

    // Reset form
    const resetForm = () => {
        setFormData(initialForm);
        setEditingPoll(null);
        setShowForm(false);
    };

    // Create or update poll
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setSubmitting(true);

        try {
            const isEditing = Boolean(editingPoll);

            const response = await fetch("/api/admin/polls", {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    ...(isEditing ? { _id: editingPoll } : {}),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to save poll");
            }

            setSuccess(
                isEditing
                    ? "Opinion poll updated successfully!"
                    : "Opinion poll created successfully!"
            );

            resetForm();
            await fetchData();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong"
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Edit poll
    const handleEdit = (poll: Poll) => {
        setError("");
        setSuccess("");

        setEditingPoll(poll._id);

        setFormData({
            title: poll.title,
            question: poll.question,
            election: poll.election?._id || "",
            candidates: poll.candidates.map((candidate) => candidate._id),
            startDate: new Date(poll.startDate).toISOString().slice(0, 16),
            endDate: new Date(poll.endDate).toISOString().slice(0, 16),
            status: poll.status,
        });

        setShowForm(true);

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Delete poll
    const handleDelete = async (poll: Poll) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${poll.title}"?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `/api/admin/polls?id=${poll._id}`,
                { method: "DELETE" }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete poll");
            }

            setSuccess("Opinion poll deleted successfully!");
            await fetchData();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong"
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
                        Opinion Poll Management
                    </h1>

                    <p className="mt-2 text-black">
                        Create and manage election opinion polls.
                    </p>
                </div>

                <button
                    onClick={() => {
                        if (showForm) {
                            resetForm();
                        } else {
                            setFormData(initialForm);
                            setEditingPoll(null);
                            setShowForm(true);
                        }

                        setError("");
                        setSuccess("");
                    }}
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                    {showForm ? "Close Form" : "+ Create Poll"}
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

            {/* Poll Form */}
            {showForm && (
                <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-6 text-xl font-bold text-black">
                        {editingPoll ? "Edit Opinion Poll" : "Create New Opinion Poll"}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Title */}
                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Poll Title
                            </label>

                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. 2027 Presidential Election Poll"
                                required
                                className="w-full rounded-lg border border-slate-300 p-3 text-black placeholder:text-slate-500"
                            />
                        </div>

                        {/* Question */}
                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Poll Question
                            </label>

                            <textarea
                                name="question"
                                value={formData.question}
                                onChange={handleChange}
                                placeholder="Who would you vote for in the upcoming election?"
                                required
                                rows={3}
                                className="w-full rounded-lg border border-slate-300 p-3 text-black placeholder:text-slate-500"
                            />
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
                                className="w-full rounded-lg border border-slate-300 p-3 text-black"
                            >
                                <option value="">Choose an election</option>

                                {elections.map((election) => (
                                    <option key={election._id} value={election._id}>
                                        {election.title} ({election.category})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Candidates */}
                        <div>
                            <label className="mb-3 block font-medium text-black">
                                Select Candidates
                            </label>

                            {!formData.election ? (
                                <p className="text-sm text-slate-500">
                                    Select an election first.
                                </p>
                            ) : selectedElectionCandidates.length === 0 ? (
                                <p className="text-sm text-red-600">
                                    No candidates are registered for this election.
                                </p>
                            ) : (
                                <div className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
                                    {selectedElectionCandidates.map((candidate) => (
                                        <label
                                            key={candidate._id}
                                            className="flex cursor-pointer items-center gap-3 rounded-lg bg-slate-50 p-3 text-black"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.candidates.includes(candidate._id)}
                                                onChange={() =>
                                                    handleCandidateSelection(candidate._id)
                                                }
                                                className="h-4 w-4 accent-blue-600"
                                            />

                                            <span>
                                                <span className="block font-semibold">
                                                    {candidate.name}
                                                </span>

                                                <span className="text-sm text-slate-600">
                                                    {candidate.party}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            <p className="mt-2 text-sm text-slate-500">
                                Selected: {formData.candidates.length} candidate(s)
                            </p>
                        </div>

                        {/* Dates */}
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    Start Date
                                </label>

                                <input
                                    type="datetime-local"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-medium text-black">
                                    End Date
                                </label>

                                <input
                                    type="datetime-local"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 p-3 text-black"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="mb-2 block font-medium text-black">
                                Poll Status
                            </label>

                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 p-3 text-black"
                            >
                                <option value="Upcoming">Upcoming</option>
                                <option value="Active">Active</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="submit"
                                disabled={
                                    submitting ||
                                    elections.length === 0 ||
                                    formData.candidates.length === 0
                                }
                                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting
                                    ? "Please wait..."
                                    : editingPoll
                                        ? "Update Poll"
                                        : "Create Poll"}
                            </button>

                            {editingPoll && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={submitting}
                                    className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-black hover:bg-slate-100"
                                >
                                    Cancel Editing
                                </button>
                            )}
                        </div>
                    </form>
                </section>
            )}

            {/* Poll List */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-black">
                        All Opinion Polls
                    </h2>

                    <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                        {polls.length} Polls
                    </span>
                </div>

                {loading ? (
                    <p className="py-10 text-center text-black">
                        Loading polls...
                    </p>
                ) : polls.length === 0 ? (
                    <div className="py-10 text-center">
                        <p className="text-4xl">📊</p>

                        <h3 className="mt-4 font-bold text-black">
                            No Opinion Polls Yet
                        </h3>

                        <p className="mt-2 text-sm text-black">
                            Create your first opinion poll to get started.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left">
                            <thead>
                                <tr className="border-b bg-slate-50 text-sm text-black">
                                    <th className="p-4">Poll</th>
                                    <th className="p-4">Election</th>
                                    <th className="p-4">Candidates</th>
                                    <th className="p-4">Start Date</th>
                                    <th className="p-4">End Date</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {polls.map((poll) => (
                                    <tr
                                        key={poll._id}
                                        className="border-b border-slate-100 text-black hover:bg-slate-50"
                                    >
                                        <td className="max-w-xs p-4">
                                            <p className="font-semibold">{poll.title}</p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {poll.question}
                                            </p>
                                        </td>

                                        <td className="p-4">
                                            {poll.election?.title || "Not available"}
                                        </td>

                                        <td className="p-4">
                                            {poll.candidates?.length || 0}
                                        </td>

                                        <td className="p-4">
                                            {new Date(poll.startDate).toLocaleDateString()}
                                        </td>

                                        <td className="p-4">
                                            {new Date(poll.endDate).toLocaleDateString()}
                                        </td>

                                        <td className="p-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${poll.status === "Active"
                                                        ? "bg-green-100 text-green-700"
                                                        : poll.status === "Upcoming"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-slate-200 text-slate-700"
                                                    }`}
                                            >
                                                {poll.status}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(poll)}
                                                    className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(poll)}
                                                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
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

            <footer className="mt-10 text-center text-sm text-black">
                VoteHub © 2026 · Nigerian Election Opinion Polling Platform
            </footer>
        </div>
    );
}