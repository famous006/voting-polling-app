"use client";

import { useEffect, useState } from "react";

interface Settings {
    platformName: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    logo: string;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        platformName: "VoteHub",
        description: "",
        contactEmail: "",
        contactPhone: "",
        logo: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const inputStyle =
        "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-black placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/admin/settings");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to load settings.");
                }

                setSettings(data.settings);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Something went wrong."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    // Handle input changes
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setSettings((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Save settings
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to save settings.");
            }

            setSettings(data.settings);
            setMessage("General settings updated successfully!");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100">
                <p className="text-slate-600">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-4xl">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        General Settings
                    </h1>

                    <p className="mt-2 text-slate-600">
                        Manage your VoteHub platform information.
                    </p>

                    <a
                        href="/admin/dashboard"
                        className="mt-4 inline-flex rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                        ← Back to Dashboard
                    </a>
                </div>

                {/* Settings Form */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl bg-white p-6 shadow-sm"
                >
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                            Platform Information
                        </h2>

                        <p className="mt-1 text-sm text-slate-600">
                            Update your platform's basic information.
                        </p>
                    </div>

                    {/* Platform Name */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-800">
                            Platform Name
                        </label>

                        <input
                            type="text"
                            name="platformName"
                            value={settings.platformName}
                            onChange={handleChange}
                            required
                            className={inputStyle}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-800">
                            Platform Description
                        </label>

                        <textarea
                            name="description"
                            value={settings.description}
                            onChange={handleChange}
                            rows={4}
                            className={inputStyle}
                        />
                    </div>

                    {/* Contact Email */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-800">
                            Contact Email
                        </label>

                        <input
                            type="email"
                            name="contactEmail"
                            value={settings.contactEmail}
                            onChange={handleChange}
                            className={inputStyle}
                        />
                    </div>

                    {/* Contact Phone */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-800">
                            Contact Phone
                        </label>

                        <input
                            type="tel"
                            name="contactPhone"
                            value={settings.contactPhone}
                            onChange={handleChange}
                            className={inputStyle}
                        />
                    </div>

                    {/* Logo URL */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-800">
                            Platform Logo URL
                        </label>

                        <input
                            type="text"
                            name="logo"
                            value={settings.logo}
                            onChange={handleChange}
                            placeholder="Enter your logo image URL"
                            className={inputStyle}
                        />

                        <p className="mt-1 text-xs text-slate-500">
                            Enter an image URL. We'll add image uploading later.
                        </p>

                        {settings.logo && (
                            <div className="mt-4">
                                <p className="mb-2 text-sm font-medium text-slate-700">
                                    Logo Preview
                                </p>

                                <img
                                    src={settings.logo}
                                    alt="Platform logo preview"
                                    className="h-20 max-w-40 rounded-lg border border-slate-200 bg-white object-contain p-2"
                                />
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className="rounded-lg bg-green-100 p-3 text-sm text-green-700">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "Saving Changes..." : "Save Settings"}
                    </button>

                </form>
            </div>
        </div>
    );
}